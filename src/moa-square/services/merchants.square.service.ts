/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import {
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
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { SquareCatalogVersionUpdatedEventPayload } from '../dto/square/square-catalog-version-updated-payload.entity.js';
import { SquareLocationCreatedEventPayload } from '../dto/square/square-location-created-event-payload.entity.js';
import { SquareLocationUpdatedEventPayload } from '../dto/square/square-location-updated-event-payload.entity.js';
import { SquareOauthAuthorizationRevokedEventPayload } from '../dto/square/square-oauth-authorization-revoked.payload.js';
import { CatalogEntity } from '../entities/catalog.entity.js';
import { MyOrderAppSquareConfig } from '../moa-square.config.js';
import { CatalogsService } from './catalogs.service.js';
import { CustomersService } from './customers.service.js';
import { LocationsService } from './locations.service.js';
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
    private readonly customersService: CustomersService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  currentTranslations() {
    return this.i18n.t('moaSquare', {
      lang: I18nContext.current()?.lang,
    });
  }

  async updateOauth(params: { oauthAccessCode: string; merchantId: string }) {
    this.logger.verbose(this.updateOauth.name);
    const translations = this.currentTranslations();
    const { merchantId, oauthAccessCode } = params;

    const merchant = await this.service.findOneOrFail({
      where: { id: merchantId },
      relations: { user: true },
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
        translations.squareInvalidResponse,
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
        translations.squareInvalidResponse,
      );
    }

    merchant.squareAccessToken = accessToken;
    merchant.squareExpiresAt = new Date(Date.parse(expiresAt));
    merchant.squareId = merchantSquareId;
    merchant.squareRefreshToken = refreshToken;

    await this.service.save(merchant);

    if (merchant.user?.id && merchant.id) {
      await this.customersService.createSaveAndSyncSquare({
        merchantIdOrPath: merchant.id,
        userId: merchant.user?.id,
      });
    }

    return merchant;
  }

  async deleteOauth(params: { merchantId: string }) {
    this.logger.verbose(this.deleteOauth.name);
    const { merchantId } = params;

    const merchant = await this.service.findOneOrFail({
      where: { id: merchantId },
      relations: { user: true, catalog: true },
    });

    merchant.squareAccessToken = null;
    merchant.squareExpiresAt = null;
    merchant.squareRefreshToken = null;
    merchant.squareId = null;
    merchant.squareBusinessName = null;
    merchant.countryCode = null;
    merchant.currencyCode = null;
    merchant.squareStatus = null;
    merchant.squareMainLocationId = null;

    await this.service.save(merchant);

    const catalogId = merchant?.catalog?.id;
    if (catalogId) {
      await this.catalogsService.delete({ id: catalogId });
    }

    await this.customersService.delete({ merchantId: merchant.id });
    await this.locationsService.delete({ merchantId: merchant.id });

    return merchant;
  }

  async sync(params: { merchantId: string }) {
    this.logger.verbose(this.sync.name);
    const translations = this.currentTranslations();
    await this.locationsSync(params);

    const merchant = await this.service.findOneOrFail({
      where: { id: params.merchantId },
    });
    const {
      id: merchantId,
      squareAccessToken,
      squareId: merchantSquareId,
    } = merchant;

    if (merchantId == null || merchantSquareId == null) {
      throw new NotFoundException(translations.merchantsNotFound);
    }

    if (squareAccessToken == null) {
      throw new UnauthorizedException(
        translations.merchantsSquareAccessTokenNotFound,
      );
    }

    const catalog: CatalogEntity =
      (await this.service.loadOneRelation<CatalogEntity>(
        merchant,
        'catalog',
      )) ??
      (await this.catalogsService.save(
        this.catalogsService.create({ merchantId }),
      ));

    const { id: catalogId } = catalog;
    if (!catalogId) {
      throw new NotFoundException(translations.merchantsNotFound);
    }

    const squareMerchant = (
      await this.squareService.retryOrThrow(squareAccessToken, (client) => {
        return client.merchantsApi.retrieveMerchant(merchantSquareId);
      })
    ).result.merchant;

    merchant.squareBusinessName = squareMerchant?.businessName;
    merchant.countryCode = squareMerchant?.country;
    merchant.languageCode = squareMerchant?.languageCode;
    merchant.currencyCode = squareMerchant?.currency;
    merchant.squareStatus = squareMerchant?.status;
    merchant.squareMainLocationId = squareMerchant?.mainLocationId;

    await this.service.save(merchant);

    await this.catalogsService.squareSyncOrFail({
      squareAccessToken,
      catalogId,
      merchantId,
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
      throw new NotFoundException(translations.merchantsNotFound);
    }

    const squareAccessToken = merchant.squareAccessToken;
    if (squareAccessToken == null) {
      throw new UnauthorizedException(
        translations.merchantsSquareAccessTokenNotFound,
      );
    }

    await this.locationsService.squareSync({ merchantId, squareAccessToken });
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
  async handleOauthAuthorizationRevoked(
    payload: SquareOauthAuthorizationRevokedEventPayload,
  ) {
    if (payload.merchant_id) {
      const merchant = await this.service.findOneOrFail({
        where: { squareId: payload.merchant_id },
      });
      if (merchant.id) {
        await this.deleteOauth({ merchantId: merchant.id });
      }
    }
  }

  /*
  We recommend refreshing access tokens every 7 days. 
  It's not recommended to wait the full 30 day before refreshing. 
  If the token does expire you'll have 10 days after expiration to refresh the token.
  */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async refreshTokensCron() {
    this.logger.verbose(this.refreshTokensCron.name);
    const threeWeeksFromNow = new Date(
      new Date().getTime() + 21 * 24 * 60 * 60 * 1000, // 21 days, 24 hours per day, 60 minutes per hour, 60 seconds per minute, 1000 milliseconds per second
    );
    const merchantsWhereSquareTokenExpiresInLessThan72Hours =
      await this.service.find({
        where: {
          squareExpiresAt: LessThan(
            DateUtils.mixedDateToUtcDatetimeString(threeWeeksFromNow),
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
