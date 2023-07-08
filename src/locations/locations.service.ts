import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from 'square';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { MoaMerchant } from '../merchants/entities/merchant.entity';
import { SquareService } from '../square/square.service';
import { MoaLocationUpdateInput } from './dto/location-update.input';
import { MoaLocation } from './entities/location.entity';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    @InjectRepository(MoaLocation)
    private readonly repository: Repository<MoaLocation>,
    @Inject(forwardRef(() => SquareService))
    private readonly squareService: SquareService,
  ) {}

  async sync(params: {
    merchantMoaId: string;
    squareAccessToken: string;
  }): Promise<MoaLocation[]> {
    const moaLocations = await this.getManyLocations({
      merchantMoaId: params.merchantMoaId,
      onlyMoaEnabled: false,
      onlySquareActive: false,
    });

    const squareClient = this.squareService.client(params.squareAccessToken);
    const squareLocations =
      (await this.squareService.listLocations(squareClient))?.locations ?? [];
    for (const squareLocation of squareLocations) {
      if (squareLocation == null) {
        continue;
      }

      let moaLocation =
        moaLocations.find((moaValue) => {
          return moaValue.locationSquareId === squareLocation.id;
        }) ?? null;
      if (moaLocation) {
        this.assignSquareLocationToMoaLocation(squareLocation, moaLocation);
        await this.save(moaLocation);
      } else if (squareLocation.id != null) {
        moaLocation = await this.create({
          squareAccessToken: params.squareAccessToken,
          locationSquareId: squareLocation.id,
          squareLocation: squareLocation,
          merchantMoaId: params.merchantMoaId,
        });

        if (moaLocation != null) {
          moaLocations.push(moaLocation);
        } else {
          this.logger.error('Failed to create location');
          throw new Error('Failed to create location');
        }
      }
    }

    return moaLocations;
  }

  async create(params: {
    squareAccessToken: string;
    locationSquareId: string;
    merchantMoaId: string;
    squareLocation?: Location | null;
  }): Promise<MoaLocation | null> {
    const squareClient = this.squareService.client(params.squareAccessToken);

    const squareLocation =
      params.squareLocation ??
      (await this.squareService.retrieveLocation(
        squareClient,
        params.locationSquareId,
      ));

    if (squareLocation != undefined) {
      const moaLocation = this.repository.create();
      this.assignSquareLocationToMoaLocation(squareLocation, moaLocation);
      moaLocation.merchantMoaId = params.merchantMoaId;

      return await this.save(moaLocation);
    } else {
      return null;
    }
  }

  async findAll(options?: FindManyOptions<MoaLocation>) {
    return await this.repository.find(options);
  }

  async findOne(options: FindOneOptions<MoaLocation>) {
    return await this.repository.findOne(options);
  }

  async findOneOrFail(options: FindOneOptions<MoaLocation>) {
    return await this.repository.findOneOrFail(options);
  }

  async save(entity: MoaLocation): Promise<MoaLocation> {
    return this.repository.save(entity);
  }

  async update(input: MoaLocationUpdateInput): Promise<MoaLocation | null> {
    const entity = await this.findOneOrFail({ where: { moaId: input.moaId } });
    this.applyUpdateToEntity(input, entity);
    return this.save(entity);
  }

  private applyUpdateToEntity(
    input: MoaLocationUpdateInput,
    entity: MoaLocation,
  ) {
    if (input.moaOrdinal !== undefined) {
      entity.moaOrdinal = input.moaOrdinal;
    }
    if (input.moaEnabled !== undefined) {
      entity.moaEnabled = input.moaEnabled;
    }
  }

  async updateAll(inputs: MoaLocationUpdateInput[]) {
    const entities: MoaLocation[] = [];

    for (const input of inputs) {
      const entity = await this.findOneOrFail({
        where: { moaId: input.moaId },
      });
      this.applyUpdateToEntity(input, entity);
      entities.push(entity);
    }

    return await this.saveAll(entities);
  }

  saveAll(entities: MoaLocation[]) {
    return this.repository.save(entities);
  }

  async remove(moaId: string) {
    const one = await this.findOne({ where: { moaId } });
    if (one) {
      return await this.repository.remove(one);
    } else {
      return null;
    }
  }

  async loadOneMerchant(
    location: MoaLocation,
  ): Promise<MoaMerchant | null | undefined> {
    return this.repository
      .createQueryBuilder()
      .relation(MoaLocation, 'merchant')
      .of(location)
      .loadOne();
  }

  async getManyLocations(params: {
    merchantMoaId: string;
    onlySquareActive: boolean;
    onlyMoaEnabled: boolean;
  }): Promise<MoaLocation[]> {
    const query = this.repository
      .createQueryBuilder('location')
      .where('location.merchantMoaId = :merchantMoaId', {
        merchantMoaId: params.merchantMoaId,
      })
      .orderBy('location.moaOrdinal', 'ASC');
    // .leftJoinAndSelect(`location.image`, `image`);

    if (params.onlySquareActive) {
      query.andWhere(`location.status = 'ACTIVE'`);
    }

    if (params.onlyMoaEnabled) {
      query.andWhere('location.moaEnabled = true');
    }

    return query.getMany();
  }

  private assignSquareLocationToMoaLocation(
    squareLocation: Location,
    moaLocation: MoaLocation,
  ) {
    moaLocation.name = squareLocation.name;
    moaLocation.description = squareLocation.description;
    moaLocation.phoneNumber = squareLocation.phoneNumber;
    moaLocation.latitude = squareLocation.coordinates?.latitude;
    moaLocation.longitude = squareLocation.coordinates?.longitude;
    moaLocation.merchantSquareId = squareLocation.merchantId;
    moaLocation.locationSquareId = squareLocation.id;
    moaLocation.status = squareLocation.status;
    moaLocation.address = squareLocation.address?.addressLine1;
    moaLocation.country = squareLocation.country;
    moaLocation.languageCode = squareLocation.languageCode;
    moaLocation.currency = squareLocation.currency;
    moaLocation.businessName = squareLocation.businessName;
    moaLocation.type = squareLocation.type;
    moaLocation.websiteUrl = squareLocation.websiteUrl;
    moaLocation.businessEmail = squareLocation.businessEmail;
    moaLocation.twitterUsername = squareLocation.twitterUsername;
    moaLocation.instagramUsername = squareLocation.instagramUsername;
    moaLocation.facebookUrl = squareLocation.facebookUrl;
    moaLocation.logoUrl = squareLocation.logoUrl;
    moaLocation.posBackgroundUrl = squareLocation.posBackgroundUrl;
    moaLocation.mcc = squareLocation.mcc;
    moaLocation.fullFormatLogoUrl = squareLocation.fullFormatLogoUrl;
  }
}
