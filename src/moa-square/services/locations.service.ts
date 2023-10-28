import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  addDays,
  addMinutes,
  format,
  isAfter,
  isBefore,
  roundToNearestMinutes,
} from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { NestSquareService } from 'nest-square';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { BusinessHoursPeriod } from 'square';
import { FindOptionsRelations, Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { LocationPatchBody } from '../dto/locations/location-patch-body.dto.js';
import { LocationsPatchBody } from '../dto/locations/locations-patch-body.dto.js';
import { LocationEntity } from '../entities/location.entity.js';
import { BusinessHoursUtils } from '../utils/locations/business-hours-period.utils.js';
import { AddressService } from './address.service.js';
import { BusinessHoursPeriodsService } from './business-hours-period.service.js';

@Injectable()
export class LocationsService extends EntityRepositoryService<LocationEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(LocationEntity)
    protected readonly repository: Repository<LocationEntity>,
    private readonly addressService: AddressService,
    private readonly businessHoursPeriodsService: BusinessHoursPeriodsService,
    private readonly squareService: NestSquareService,
    protected readonly i18n: I18nService<I18nTranslations>,
  ) {
    const logger = new Logger(LocationsService.name);
    super(repository, logger);
    this.logger = logger;
  }

  translations() {
    return this.i18n.t('moaSquare', {
      lang: I18nContext.current()?.lang,
    });
  }

  async validatePickupDateTimeOrThrow(params: {
    id: string;
    pickupDate: Date;
  }) {
    this.logger.verbose(this.validatePickupDateTimeOrThrow.name);
    const { id, pickupDate } = params;
    const translations = this.translations();

    const location = await this.findOneOrFail({
      where: { id },
      relations: {
        businessHours: true,
      },
    });
    const { timezone, businessHours } = location;

    if (!timezone || !businessHours) {
      throw new NotFoundException(translations.locationsTimezoneNotFound);
    }

    const now = new Date();

    if (isBefore(pickupDate, now)) {
      throw new BadRequestException(translations.locationsPickupInPast);
    }

    if (isAfter(pickupDate, addDays(now, 7))) {
      throw new BadRequestException(translations.locationsPickupTooFarInFuture);
    }

    const pickupInLocalTimeDate = utcToZonedTime(pickupDate, timezone);
    const pickupLocalTime = format(pickupInLocalTimeDate, 'HH:mm:ss');
    const pickupLocalDayOfWeek = format(
      pickupInLocalTimeDate,
      'eee',
    ).toUpperCase();

    const matchingPeriod = businessHours.find(
      (period) => period.dayOfWeek === pickupLocalDayOfWeek,
    );
    const startLocalTime = matchingPeriod?.startLocalTime;
    const endLocalTime = matchingPeriod?.endLocalTime;

    if (!matchingPeriod || !startLocalTime || !endLocalTime) {
      throw new BadRequestException(
        translations.locationsPickupOutsideBusinessHours,
      );
    }

    if (pickupLocalTime < startLocalTime || pickupLocalTime > endLocalTime) {
      throw new BadRequestException(
        translations.locationsPickupOutsideBusinessHours,
      );
    }
  }

  async firstPickupDateAtLocationWithinDuration(params: {
    locationId: string;
    durationMinutes: number;
  }): Promise<Date> {
    const { locationId, durationMinutes } = params;

    this.logger.verbose(this.firstPickupDateAtLocationWithinDuration.name);
    this.logger.verbose(JSON.stringify(params));

    const translations = this.translations();

    const location = await this.findOneOrFail({
      where: { id: locationId },
      relations: {
        businessHours: true,
      },
    });
    const { timezone, businessHours } = location;

    this.logger.debug(timezone);

    if (!timezone || !businessHours) {
      throw new UnprocessableEntityException(
        translations.locationsTimezoneNotFound,
      );
    }

    const utcNowDate = new Date();
    const localNowDate = utcToZonedTime(utcNowDate, timezone);
    const localDateAfterDuration = roundToNearestMinutes(
      addMinutes(localNowDate, durationMinutes),
      { nearestTo: 5 },
    );

    try {
      const firstPickupDateWithin =
        BusinessHoursUtils.firstPickupDateAfterOrThrow({
          businessHours,
          date: localDateAfterDuration,
          durationMinutes,
        });
      const result = zonedTimeToUtc(firstPickupDateWithin, timezone);

      this.logger.verbose(result?.toISOString());
      return result;
    } catch (error) {
      throw new NotFoundException(translations.locationsBusinessHoursNotFound);
    }
  }

  async findAndCountWithMerchantIdOrPath(params: {
    where: {
      merchantIdOrPath: string;
      status?: string;
    };
    relations?: FindOptionsRelations<LocationEntity>;
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
  }): Promise<LocationEntity[]> {
    this.logger.verbose(this.syncSquare.name);
    const { merchantId, squareAccessToken: accessToken } = params;
    const translations = this.translations();
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
      throw new NotFoundException(translations.locationsMainNotFound);
    }

    for (const squareLocation of squareLocations) {
      if (!squareLocation?.id) continue;

      let moaLocation = locations.find(
        (location) => location.squareId === squareLocation.id,
      );

      if (!moaLocation) {
        moaLocation = this.create({
          squareId: squareLocation.id,
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
      } = squareLocation;

      Object.assign(moaLocation, {
        merchantSquareId,
        locationSquareId,
        name,
        // latitude: coordinates?.latitude,
        // longitude: coordinates?.longitude,
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
    entity: LocationEntity;
    input: LocationPatchBody;
  }): Promise<LocationEntity> {
    this.logger.verbose(this.updateOne.name);
    if (params.input.moaOrdinal !== undefined) {
      params.entity.moaOrdinal = params.input.moaOrdinal;
    }
    if (params.input.moaEnabled !== undefined) {
      params.entity.moaEnabled = params.input.moaEnabled;
    }
    return this.save(params.entity);
  }

  async updateAll(inputs: LocationsPatchBody[]) {
    this.logger.verbose(this.updateAll.name);
    const entities: LocationEntity[] = [];

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
