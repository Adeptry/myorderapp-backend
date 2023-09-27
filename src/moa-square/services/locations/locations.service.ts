import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BusinessHoursPeriod } from 'square';
import { FindOptionsRelations, Repository } from 'typeorm';
import { NestSquareService } from '../../../square/nest-square.service.js';
import { EntityRepositoryService } from '../../../utils/entity-repository-service.js';
import {
  LocationUpdateAllDto,
  LocationUpdateDto,
} from '../../dto/locations/location-update.input.js';
import { LocationEntity as MoaLocation } from '../../entities/locations/location.entity.js';
import { AddressService } from './address.service.js';
import { BusinessHoursPeriodsService } from './business-hours-period.service.js';

@Injectable()
export class LocationsService extends EntityRepositoryService<MoaLocation> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(MoaLocation)
    protected readonly repository: Repository<MoaLocation>,
    private readonly addressService: AddressService,
    private readonly businessHoursPeriodsService: BusinessHoursPeriodsService,
    private readonly squareService: NestSquareService,
  ) {
    const logger = new Logger(LocationsService.name);
    super(repository, logger);
    this.logger = logger;
  }

  async findAndCountWithMerchantIdOrPath(params: {
    where: {
      merchantIdOrPath: string;
      status?: string;
    };
    relations?: FindOptionsRelations<MoaLocation>;
  }) {
    this.logger.verbose(this.findAndCountWithMerchantIdOrPath.name);
    return await this.findAndCount({
      where: [
        {
          merchant: { id: params.where.merchantIdOrPath },
          status: params.where.status,
        },
        {
          merchant: {
            appConfig: { path: params.where.merchantIdOrPath },
          },
          status: params.where.status,
        },
      ],
      relations: params.relations,
    });
  }

  async syncSquare(params: {
    merchantId: string;
    squareAccessToken: string;
  }): Promise<MoaLocation[]> {
    this.logger.verbose(this.syncSquare.name);
    const { merchantId, squareAccessToken: accessToken } = params;
    const locations = await this.find({
      where: { merchantId },
      relations: ['address', 'businessHours'],
    });

    const squareLocationsResponse = await this.squareService.retryOrThrow(
      accessToken,
      (client) => client.locationsApi.listLocations(),
    );

    const squareLocations = squareLocationsResponse?.result.locations ?? [];

    const squareMainLocationResponse = await this.squareService.retryOrThrow(
      accessToken,
      (client) => {
        return client.locationsApi.retrieveLocation('main');
      },
    );

    const squareMainLocation = squareMainLocationResponse.result.location;
    if (!squareMainLocation) {
      this.logger.error('Failed to retrieve main location');
      throw new NotFoundException('Failed to retrieve main location');
    }

    for (const squareLocation of squareLocations) {
      if (!squareLocation?.id) continue;

      let moaLocation = locations.find(
        (location) => location.locationSquareId === squareLocation.id,
      );

      if (!moaLocation) {
        moaLocation = this.create({
          locationSquareId: squareLocation.id,
          merchantSquareId: squareLocation.merchantId,
          isMain: squareLocation.id === squareMainLocation?.id,
          merchantId,
        });
        locations.push(moaLocation);
      }

      const {
        merchantId: merchantSquareId,
        id: locationSquareId,
        name,
        description,
        phoneNumber,
        status,
        timezone,
        country,
        languageCode,
        currency,
        businessName,
        type,
        websiteUrl,
        businessEmail,
        twitterUsername,
        instagramUsername,
        facebookUrl,
        logoUrl,
        posBackgroundUrl,
        mcc,
        fullFormatLogoUrl,
        coordinates,
      } = squareLocation;

      Object.assign(moaLocation, {
        merchantSquareId,
        locationSquareId,
        name,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        description,
        phoneNumber,
        status,
        timezone,
        country,
        languageCode,
        currency,
        businessName,
        type,
        websiteUrl,
        businessEmail,
        twitterUsername,
        instagramUsername,
        facebookUrl,
        logoUrl,
        posBackgroundUrl,
        mcc,
        fullFormatLogoUrl,
      });

      moaLocation.isMain = squareLocation.id === squareMainLocation.id;

      // Sync Address
      if (squareLocation.address) {
        if (moaLocation.address) {
          this.addressService.merge(
            moaLocation.address,
            squareLocation.address,
          );
          await this.addressService.save(moaLocation.address);
        } else {
          const newAddress = this.addressService.create(squareLocation.address);
          await this.addressService.save(newAddress);
          moaLocation.address = newAddress;
        }
      } else if (moaLocation.address) {
        await this.addressService.remove(moaLocation.address);
        moaLocation.address = null;
      }

      // Sync BusinessHoursPeriod
      const squareBusinessHours: BusinessHoursPeriod[] =
        squareLocation.businessHours?.periods ?? [];

      // Remove all existing BusinessHoursPeriod
      if (moaLocation.businessHours) {
        await this.businessHoursPeriodsService.removeAll(
          moaLocation.businessHours,
        );
      }

      // Re-create BusinessHoursPeriod from Square data
      for (const squareBhp of squareBusinessHours) {
        const moaBhp = this.businessHoursPeriodsService.create({
          locationId: moaLocation.id,
          ...squareBhp,
        });
        await this.businessHoursPeriodsService.save(moaBhp);

        if (!moaLocation.businessHours) moaLocation.businessHours = [];
        moaLocation.businessHours.push(moaBhp);
      }

      try {
        await this.save(moaLocation);
      } catch (error: any) {
        this.logger.error('Failed to save location');
      }
    }

    return locations;
  }

  async updateOne(params: {
    entity: MoaLocation;
    input: LocationUpdateDto;
  }): Promise<MoaLocation> {
    this.logger.verbose(this.updateOne.name);
    if (params.input.moaOrdinal !== undefined) {
      params.entity.moaOrdinal = params.input.moaOrdinal;
    }
    if (params.input.moaEnabled !== undefined) {
      params.entity.moaEnabled = params.input.moaEnabled;
    }
    return this.save(params.entity);
  }

  async updateAll(inputs: LocationUpdateAllDto[]) {
    this.logger.verbose(this.updateAll.name);
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
}
