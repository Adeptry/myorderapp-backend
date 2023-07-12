import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location as SquareLocation } from 'square';
import { BaseService } from 'src/utils/base-service';
import { paginated } from 'src/utils/paginated';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';
import { PaginationOptions } from 'src/utils/types/pagination-options';
import { Repository } from 'typeorm';
import { Merchant } from '../merchants/entities/merchant.entity';
import { SquareService } from '../square/square.service';
import {
  LocationUpdateAllInput,
  LocationUpdateInput,
} from './dto/location-update.input';
import { Location as MoaLocation } from './entities/location.entity';

@Injectable()
export class LocationsService extends BaseService<MoaLocation> {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    @InjectRepository(MoaLocation)
    protected readonly repository: Repository<MoaLocation>,
    @Inject(SquareService)
    private readonly squareService: SquareService,
  ) {
    super(repository);
  }

  async sync(params: {
    merchantId: string;
    squareAccessToken: string;
  }): Promise<MoaLocation[]> {
    const moaLocations = (
      await this.getManyLocations({
        merchantId: params.merchantId,
        onlyMoaEnabled: false,
        onlySquareActive: false,
        pagination: { limit: 1000, page: 1 }, // todo: paul fix
      })
    ).data;

    const client = this.squareService.client({
      accessToken: params.squareAccessToken,
    });
    const squareLocations =
      (await this.squareService.listLocations({ client }))?.locations ?? [];
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
          locationSquareId: squareLocation.id,
          merchantSquareId: squareLocation.merchantId,
          merchantId: params.merchantId,
        });

        this.assignSquareLocationToMoaLocation(squareLocation, moaLocation);
        await this.save(moaLocation);

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

  async assignAndSave(params: {
    id: string;
    input: LocationUpdateInput;
  }): Promise<MoaLocation> {
    const entity = await this.findOneOrFail({ where: { id: params.id } });
    if (params.input.moaOrdinal !== undefined) {
      entity.moaOrdinal = params.input.moaOrdinal;
    }
    if (params.input.moaEnabled !== undefined) {
      entity.moaEnabled = params.input.moaEnabled;
    }
    return this.save(entity);
  }

  async updateAll(inputs: LocationUpdateAllInput[]) {
    const entities: MoaLocation[] = [];

    for (const input of inputs) {
      const entity = await this.findOneOrFail({
        where: { id: input.id },
      });
      if (input.moaOrdinal !== undefined) {
        entity.moaOrdinal = input.moaOrdinal;
      }
      if (input.moaEnabled !== undefined) {
        entity.moaEnabled = input.moaEnabled;
      }
      entities.push(entity);
    }

    return await this.saveAll(entities);
  }

  async loadOneMerchant(
    location: MoaLocation,
  ): Promise<Merchant | null | undefined> {
    return this.repository
      .createQueryBuilder()
      .relation(Location, 'merchant')
      .of(location)
      .loadOne();
  }

  async getManyLocations(params: {
    pagination: PaginationOptions;
    merchantId: string;
    onlySquareActive: boolean;
    onlyMoaEnabled: boolean;
  }): Promise<InfinityPaginationResultType<MoaLocation>> {
    if (!params.merchantId) {
      throw new BadRequestException('merchantId is required');
    }

    const query = this.repository
      .createQueryBuilder('location')
      .where('location.merchantId = :merchantId', {
        merchantId: params.merchantId,
      })
      .orderBy('location.moaOrdinal', 'ASC');
    // .leftJoinAndSelect(`location.image`, `image`);

    if (params.pagination) {
      query.skip((params.pagination.page - 1) * params.pagination.limit);
      query.take(params.pagination.limit);
    }

    if (params.onlySquareActive) {
      query.andWhere(`location.status = 'ACTIVE'`);
    }

    if (params.onlyMoaEnabled) {
      query.andWhere('location.moaEnabled = true');
    }

    const result = await query.getManyAndCount();
    return paginated({
      data: result[0],
      count: result[1],
      pagination: params.pagination,
    });
  }

  private assignSquareLocationToMoaLocation(
    squareLocation: SquareLocation,
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
