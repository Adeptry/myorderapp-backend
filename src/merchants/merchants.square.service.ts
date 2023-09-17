import {
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan } from 'typeorm';
import { DateUtils } from 'typeorm/util/DateUtils.js';
import { CatalogsService } from '../catalogs/catalogs.service.js';
import { Catalog } from '../catalogs/entities/catalog.entity.js';
import { AllConfigType } from '../config.type.js';
import { SquareCatalogVersionUpdatedEventPayload } from '../square/payloads/square-catalog-version-updated-payload.entity.js';
import { SquareLocationCreatedEventPayload } from '../square/payloads/square-location-created-event-payload.entity.js';
import { SquareLocationUpdatedEventPayload } from '../square/payloads/square-location-updated-event-payload.entity.js';
import { SquareOauthAuthorizationRevokedEventPayload } from '../square/payloads/square-oauth-authorization-revoked.payload.js';
import { SquareConfigUtils } from '../square/square.config.utils.js';
import { SquareService } from '../square/square.service.js';
import { MerchantsService } from './merchants.service.js';

export class MerchantsSquareService {
  private readonly logger = new Logger(MerchantsSquareService.name);
  private readonly squareConfigUtils: SquareConfigUtils;
  constructor(
    protected readonly service: MerchantsService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly squareService: SquareService,
    private readonly catalogsService: CatalogsService,
  ) {
    this.squareConfigUtils = new SquareConfigUtils(configService);
  }

  async confirmOauthAndSave(params: {
    oauthAccessCode: string;
    merchantId: string;
  }) {
    const { merchantId, oauthAccessCode } = params;

    const merchant = await this.service.findOneOrFail({
      where: { id: merchantId },
    });

    const nodeEnv = this.configService.get('app.nodeEnv', { infer: true });
    const testCode = this.configService.get('square.testCode', { infer: true });
    const isTest = nodeEnv !== 'production' && oauthAccessCode === testCode;

    try {
      const accessTokenResult = isTest
        ? this.squareConfigUtils.testTokenReponse()
        : (
            await this.squareService.obtainToken({
              oauthAccessCode,
            })
          ).result;

      if (!accessTokenResult) {
        throw new InternalServerErrorException(
          'Failed to obtain token from Square service',
        );
      }

      const { accessToken, expiresAt, merchantId, refreshToken } =
        accessTokenResult;

      if (!expiresAt) {
        throw new InternalServerErrorException(
          'No expiry date provided in the access token',
        );
      }

      merchant.squareAccessToken = accessToken;
      merchant.squareExpiresAt = new Date(Date.parse(expiresAt));
      merchant.squareId = merchantId;
      merchant.squareRefreshToken = refreshToken;

      return this.service.save(merchant);
    } catch {
      throw new InternalServerErrorException(
        'Failed to obtain token from Square service',
      );
    }
  }

  async sync(params: { merchantId: string }) {
    await this.locationsSync(params);

    const merchant = await this.service.findOneOrFail({
      where: { id: params.merchantId },
    });

    if (merchant?.id == null) {
      throw new NotFoundException('Merchant id is null');
    }

    const squareAccessToken = merchant.squareAccessToken;
    if (squareAccessToken == null) {
      throw new UnauthorizedException('Square access token is null');
    }

    let catalog = await this.service.loadOneRelation<Catalog>(
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
      throw new Error('Catalog id is null');
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
    const merchant = await this.service.findOneOrFail({
      where: { id: params.merchantId },
    });

    if (merchant.id == null) {
      throw new NotFoundException('Merchant id is null');
    }

    const squareAccessToken = merchant.squareAccessToken;
    if (squareAccessToken == null) {
      throw new UnauthorizedException('Square access token is null');
    }
  }

  @OnEvent('square.location.created')
  async handleLocationCreated(payload: SquareLocationCreatedEventPayload) {
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
          await this.squareService.refreshToken({
            oauthRefreshToken,
          })
        ).result;
        merchant.squareAccessToken = result.accessToken;
        merchant.squareExpiresAt = new Date(Date.parse(result.expiresAt ?? ''));
        merchant.squareId = result.merchantId;
        merchant.squareRefreshToken = result.refreshToken;
        await this.service.save(merchant);
      } catch (error) {
        this.logger.error("Failed to refresh merchant's Square token", error);
      }
    }
  }
}
