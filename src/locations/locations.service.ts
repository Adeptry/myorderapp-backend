import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location as SquareLocation } from 'square';
import { BaseService } from 'src/utils/base-service';
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
    const locations = await this.find({
      where: { merchantId: params.merchantId },
    });

    const squareLocations =
      (
        await this.squareService.listLocations({
          accessToken: params.squareAccessToken,
        })
      )?.result.locations ?? [];
    for (const squareLocation of squareLocations) {
      if (squareLocation == null) {
        continue;
      }

      let moaLocation =
        locations.find((moaValue) => {
          return moaValue.locationSquareId === squareLocation.id;
        }) ?? null;
      if (moaLocation) {
        this.assignSquareLocationToMoaLocation(squareLocation, moaLocation);
        this.logger.debug(
          `Business Hours: ${JSON.stringify(squareLocation.businessHours)}`,
        );

        await this.save(moaLocation);
      } else if (squareLocation.id != null) {
        moaLocation = this.create({
          locationSquareId: squareLocation.id,
          merchantSquareId: squareLocation.merchantId,
          merchantId: params.merchantId,
        });

        this.assignSquareLocationToMoaLocation(squareLocation, moaLocation);
        await this.save(moaLocation);

        if (moaLocation != null) {
          locations.push(moaLocation);
        } else {
          this.logger.error('Failed to create location');
          throw new Error('Failed to create location');
        }
      }
    }

    return locations;
  }

  async assignAndSave(params: {
    entity: MoaLocation;
    input: LocationUpdateInput;
  }): Promise<MoaLocation> {
    if (params.input.moaOrdinal !== undefined) {
      params.entity.moaOrdinal = params.input.moaOrdinal;
    }
    if (params.input.moaEnabled !== undefined) {
      params.entity.moaEnabled = params.input.moaEnabled;
    }
    return this.save(params.entity);
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
