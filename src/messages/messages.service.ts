import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';
import { TwilioService } from 'nestjs-twilio';
import { NestAppConfig } from '../configs/app.config.js';
import { TwilioConfig } from '../configs/twilio.config.js';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { OrderEntity } from '../moa-square/entities/order.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly twilioService: TwilioService,
    private readonly i18n: I18nService<I18nTranslations>,
    @Inject(TwilioConfig.KEY)
    private readonly config: ConfigType<typeof TwilioConfig>,
    @Inject(NestAppConfig.KEY)
    private readonly configService: ConfigType<typeof NestAppConfig>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  private defaultTranslationOptions(lang?: string | null): TranslateOptions {
    return {
      lang: lang ?? I18nContext.current()?.lang,
      defaultValue: this.configService.fallbackLanguage,
    };
  }

  private translations(lang?: string | null) {
    return this.i18n.t('messages', {
      lang: lang ?? I18nContext.current()?.lang,
    });
  }

  async sendPostSquarePaymentOrderCurrentOrThrow(params: {
    user: UserEntity;
    order: OrderEntity;
  }) {
    const { user, order } = params;

    this.logger.verbose(this.sendPostSquarePaymentOrderCurrentOrThrow.name);

    if (!user.phoneNumber) {
      throw new NotFoundException(
        this.translations(user.language).phoneNumberNotFound,
      );
    }

    await this.twilioService.client.messages.create({
      to: user.phoneNumber,
      body: this.i18n.t('messages.postSquarePaymentOrderCurrent', {
        ...this.defaultTranslationOptions(user.language),
        args: { order },
      }),
      from: this.config.phoneNumber,
    });
  }

  async sendOnEventSquareFulfillmentUpdateCanceledOrThrow(params: {
    user: UserEntity;
    order: OrderEntity;
  }) {
    const { user, order } = params;

    this.logger.verbose(
      this.sendOnEventSquareFulfillmentUpdateCanceledOrThrow.name,
    );

    if (!user.phoneNumber) {
      throw new NotFoundException(
        this.translations(user.language).phoneNumberNotFound,
      );
    }

    await this.twilioService.client.messages.create({
      to: user.phoneNumber,
      body: this.i18n.t('messages.onEventSquareFulfillmentUpdateCanceled', {
        ...this.defaultTranslationOptions(user.language),
        args: { order },
      }),
      from: this.config.phoneNumber,
    });
  }

  async sendOnEventSquareFulfillmentUpdateCompletedOrThrow(params: {
    user: UserEntity;
    order: OrderEntity;
  }) {
    const { user, order } = params;

    this.logger.verbose(
      this.sendOnEventSquareFulfillmentUpdateCompletedOrThrow.name,
    );

    if (!user.phoneNumber) {
      throw new NotFoundException(
        this.translations(user.language).phoneNumberNotFound,
      );
    }

    await this.twilioService.client.messages.create({
      to: user.phoneNumber,
      body: this.i18n.t('messages.onEventSquareFulfillmentUpdateCompleted', {
        ...this.defaultTranslationOptions(user.language),
        args: { order },
      }),
      from: this.config.phoneNumber,
    });
  }

  async sendOnEventSquareFulfillmentUpdateFailedOrThrow(params: {
    user: UserEntity;
    order: OrderEntity;
  }) {
    const { user, order } = params;

    this.logger.verbose(
      this.sendOnEventSquareFulfillmentUpdateFailedOrThrow.name,
    );

    if (!user.phoneNumber) {
      throw new NotFoundException(
        this.translations(user.language).phoneNumberNotFound,
      );
    }

    await this.twilioService.client.messages.create({
      to: user.phoneNumber,
      body: this.i18n.t('messages.onEventSquareFulfillmentUpdateFailed', {
        ...this.defaultTranslationOptions(user.language),
        args: { order },
      }),
      from: this.config.phoneNumber,
    });
  }

  async sendOnEventSquareFulfillmentUpdatePreparedOrThrow(params: {
    user: UserEntity;
    order: OrderEntity;
  }) {
    const { user, order } = params;

    this.logger.verbose(
      this.sendOnEventSquareFulfillmentUpdatePreparedOrThrow.name,
    );

    if (!user.phoneNumber) {
      throw new NotFoundException(
        this.translations(user.language).phoneNumberNotFound,
      );
    }

    await this.twilioService.client.messages.create({
      to: user.phoneNumber,
      body: this.i18n.t('messages.onEventSquareFulfillmentUpdatePrepared', {
        ...this.defaultTranslationOptions(user.language),
        args: { order },
      }),
      from: this.config.phoneNumber,
    });
  }

  async sendOnEventSquareFulfillmentUpdateProposedOrThrow(params: {
    user: UserEntity;
    order: OrderEntity;
  }) {
    const { user, order } = params;

    this.logger.verbose(
      this.sendOnEventSquareFulfillmentUpdateProposedOrThrow.name,
    );

    if (!user.phoneNumber) {
      throw new NotFoundException(
        this.translations(user.language).phoneNumberNotFound,
      );
    }

    await this.twilioService.client.messages.create({
      to: user.phoneNumber,
      body: this.i18n.t('messages.onEventSquareFulfillmentUpdateProposed', {
        ...this.defaultTranslationOptions(user.language),
        args: { order },
      }),
      from: this.config.phoneNumber,
    });
  }

  async sendOnEventSquareFulfillmentUpdateReservedOrThrow(params: {
    user: UserEntity;
    order: OrderEntity;
  }) {
    const { user, order } = params;

    this.logger.verbose(
      this.sendOnEventSquareFulfillmentUpdateReservedOrThrow.name,
    );

    if (!user.phoneNumber) {
      throw new NotFoundException(
        this.translations(user.language).phoneNumberNotFound,
      );
    }

    await this.twilioService.client.messages.create({
      to: user.phoneNumber,
      body: this.i18n.t('messages.onEventSquareFulfillmentUpdateReserved', {
        ...this.defaultTranslationOptions(user.language),
        args: { order },
      }),
      from: this.config.phoneNumber,
    });
  }
}
