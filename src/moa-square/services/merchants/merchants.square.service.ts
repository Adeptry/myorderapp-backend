import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NestSquareService } from 'nest-square';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { LessThan } from 'typeorm';
import { DateUtils } from 'typeorm/util/DateUtils.js';
import { I18nTranslations } from '../../../i18n/i18n.generated.js';
import { SquareCatalogVersionUpdatedEventPayload } from '../../dto/square/square-catalog-version-updated-payload.entity.js';
import { SquareLocationCreatedEventPayload } from '../../dto/square/square-location-created-event-payload.entity.js';
import { SquareLocationUpdatedEventPayload } from '../../dto/square/square-location-updated-event-payload.entity.js';
import { SquareOauthAuthorizationRevokedEventPayload } from '../../dto/square/square-oauth-authorization-revoked.payload.js';
import { CatalogEntity } from '../../entities/catalogs/catalog.entity.js';
import { MyOrderAppSquareConfig } from '../../moa-square.config.js';
import { CatalogsService } from '../catalogs/catalogs.service.js';
import { LocationsService } from '../locations/locations.service.js';
import { MerchantsService } from './merchants.service.js';

@Injectable()
export class MerchantsSquareService {
  private readonly logger = new Logger(MerchantsSquareService.name);

  constructor(
    private readonly service: MerchantsService,
    @Inject(MyOrderAppSquareConfig.KEY)
    private readonly config: ConfigType<typeof MyOrderAppSquareConfig>,
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly squareService: NestSquareService,
    private readonly catalogsService: CatalogsService,
    private readonly locationsService: LocationsService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  currentTranslations() {
    return this.i18n.t('merchants', {
      lang: I18nContext.current()?.lang,
    });
  }

  async updateOauth(params: { oauthAccessCode: string; merchantId: string }) {
    this.logger.verbose(this.updateOauth.name);
    const translations = this.currentTranslations();
    const { merchantId, oauthAccessCode } = params;

    const merchant = await this.service.findOneOrFail({
      where: { id: merchantId },
    });

    const accessTokenResult =
      oauthAccessCode === this.config.squareTestCode
        ? {
            accessToken: this.config.squareTestAccessToken,
            expiresAt: this.config.squareTestExpireAt,
            merchantId: this.config.squareTestId,
            refreshToken: this.config.squareTestRefreshToken,
          }
        : (
            await this.squareService.retryObtainTokenOrThrow({
              code: oauthAccessCode,
            })
          ).result;

    if (!accessTokenResult) {
      throw new InternalServerErrorException(
        translations.invalidSquareResponse,
      );
    }

    const {
      accessToken,
      expiresAt,
      merchantId: merchantSquareId,
      refreshToken,
    } = accessTokenResult;

    if (!expiresAt) {
      throw new InternalServerErrorException(
        translations.invalidSquareResponse,
      );
    }

    merchant.squareAccessToken = accessToken;
    merchant.squareExpiresAt = new Date(Date.parse(expiresAt));
    merchant.squareId = merchantSquareId;
    merchant.squareRefreshToken = refreshToken;

    return this.service.save(merchant);
  }

  async sync(params: { merchantId: string }) {
    this.logger.verbose(this.sync.name);
    const translations = this.currentTranslations();
    await this.locationsSync(params);

    const merchant = await this.service.findOneOrFail({
      where: { id: params.merchantId },
    });

    if (merchant?.id == null) {
      throw new NotFoundException(translations.doesNotExist);
    }

    const squareAccessToken = merchant.squareAccessToken;
    if (squareAccessToken == null) {
      throw new UnauthorizedException(translations.needSquareAuthorization);
    }

    let catalog = await this.service.loadOneRelation<CatalogEntity>(
      merchant,
      'catalog',
    );
    if (catalog == null) {
      catalog = this.catalogsService.createEmpty();
      merchant.catalog = catalog;
      await this.catalogsService.save(catalog);
      await this.service.save(merchant);
    }

    if (catalog.id == null) {
      throw new BadRequestException(translations.needsCatalog);
    }

    await this.catalogsService.squareSync({
      squareAccessToken,
      catalogId: catalog.id,
      merchantId: merchant.id,
    });

    return;
  }

  /*
   * Private because it must happen before catalog sync
   */
  private async locationsSync(params: { merchantId: string }) {
    this.logger.verbose(this.locationsSync.name);
    const translations = this.currentTranslations();
    const merchant = await this.service.findOneOrFail({
      where: { id: params.merchantId },
    });

    const merchantId = merchant.id;
    if (merchantId == null) {
      throw new NotFoundException(translations.doesNotExist);
    }

    const squareAccessToken = merchant.squareAccessToken;
    if (squareAccessToken == null) {
      throw new UnauthorizedException(translations.needSquareAuthorization);
    }

    await this.locationsService.syncSquare({ merchantId, squareAccessToken });
  }

  @OnEvent('square.location.created')
  async handleLocationCreated(payload: SquareLocationCreatedEventPayload) {
    this.logger.verbose(this.handleLocationCreated.name);
    if (!payload.merchant_id) {
      this.logger.error(
        'Missing merchant_id in SquareLocationCreatedEventPayload',
      );
      return;
    }

    const merchant = await this.service.findOneOrFail({
      where: { squareId: payload.merchant_id },
    });

    if (!merchant.id) {
      this.logger.error(`Merchant with id ${payload.merchant_id} not found`);
      return;
    }

    await this.locationsSync({ merchantId: merchant.id });
  }

  @OnEvent('square.location.updated')
  async handleLocationUpdated(payload: SquareLocationUpdatedEventPayload) {
    this.logger.verbose(this.handleLocationUpdated.name);
    if (!payload.merchant_id) {
      this.logger.error(
        'Missing merchant_id in SquareLocationCreatedEventPayload',
      );
      return;
    }

    const merchant = await this.service.findOneOrFail({
      where: { squareId: payload.merchant_id },
    });

    if (!merchant.id) {
      this.logger.error(`Merchant with id ${payload.merchant_id} not found`);
      return;
    }

    await this.locationsSync({ merchantId: merchant.id });
  }

  @OnEvent('square.catalog.version.updated')
  async handleCatalogVersionUpdated(
    payload: SquareCatalogVersionUpdatedEventPayload,
  ) {
    this.logger.verbose(this.handleCatalogVersionUpdated.name);
    if (!payload.merchant_id) {
      this.logger.error(
        'Missing merchant_id in SquareLocationCreatedEventPayload',
      );
      return;
    }

    const merchant = await this.service.findOneOrFail({
      where: { squareId: payload.merchant_id },
    });

    if (!merchant?.id) {
      this.logger.error(`Merchant with id ${payload.merchant_id} not found`);
      return;
    }

    await this.sync({ merchantId: merchant.id });
  }

  @OnEvent('square.oauth.authorization.revoked')
  handleOauthAuthorizationRevoked(
    payload: SquareOauthAuthorizationRevokedEventPayload,
  ) {
    this.logger.debug(
      `Handling SquareOauthAuthorizationRevokedEventPayload ${JSON.stringify(
        payload,
      )}}`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async refreshTokensCron() {
    this.logger.verbose(this.refreshTokensCron.name);
    const seventyTwoHoursFromNow = new Date(
      new Date().getTime() + 72 * 60 * 60 * 1000,
    );
    const merchantsWhereSquareTokenExpiresInLessThan72Hours =
      await this.service.find({
        where: {
          squareExpiresAt: LessThan(
            DateUtils.mixedDateToUtcDatetimeString(seventyTwoHoursFromNow),
          ),
        },
      });

    for (const merchant of merchantsWhereSquareTokenExpiresInLessThan72Hours) {
      try {
        const oauthRefreshToken = merchant.squareRefreshToken ?? '';
        const result = (
          await this.squareService.retryRefreshTokenOrThrow({
            refreshToken: oauthRefreshToken,
          })
        ).result;
        merchant.squareAccessToken = result.accessToken;
        merchant.squareExpiresAt = new Date(Date.parse(result.expiresAt ?? ''));
        merchant.squareId = result.merchantId;
        merchant.squareRefreshToken = result.refreshToken;
        await this.service.save(merchant);
      } catch (error: any) {
        this.logger.error("Failed to refresh merchant's Square token", error);
      }
    }
  }
}
