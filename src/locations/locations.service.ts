import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BusinessHoursPeriod } from 'square';
import { SquareService } from 'src/square/square.service';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { Repository } from 'typeorm';
import {
  LocationUpdateAllDto,
  LocationUpdateDto,
} from './dto/location-update.input';
import { Location as MoaLocation } from './entities/location.entity';
import { AddressService } from './services/address.service';
import { BusinessHoursPeriodsService } from './services/business-hours-period.service';

@Injectable()
export class LocationsService extends EntityRepositoryService<MoaLocation> {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    @InjectRepository(MoaLocation)
    protected readonly repository: Repository<MoaLocation>,
    @Inject(AddressService)
    private readonly addressService: AddressService,
    @Inject(BusinessHoursPeriodsService)
    private readonly businessHoursPeriodsService: BusinessHoursPeriodsService,
    @Inject(SquareService)
    private readonly squareService: SquareService,
  ) {
    super(repository);
  }

  async sync(params: {
    merchantId: string;
    squareAccessToken: string;
  }): Promise<MoaLocation[]> {
    const { merchantId, squareAccessToken: accessToken } = params;
    const locations = await this.find({
      where: { merchantId },
      relations: ['address', 'businessHours'],
    });

    const squareLocationsResponse = await this.squareService.listLocations({
      accessToken,
    });
    const squareLocations = squareLocationsResponse?.result.locations ?? [];

    const squareMainLocationResponse =
      await this.squareService.retrieveLocation({
        accessToken,
        locationSquareId: 'main',
      });
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
      } catch (error) {
        this.logger.error('Failed to save location');
        throw new Error('Failed to save location');
      }
    }

    return locations;
  }

  async assignAndSave(params: {
    entity: MoaLocation;
    input: LocationUpdateDto;
  }): Promise<MoaLocation> {
    if (params.input.moaOrdinal !== undefined) {
      params.entity.moaOrdinal = params.input.moaOrdinal;
    }
    if (params.input.moaEnabled !== undefined) {
      params.entity.moaEnabled = params.input.moaEnabled;
    }
    return this.save(params.entity);
  }

  async updateAll(inputs: LocationUpdateAllDto[]) {
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
