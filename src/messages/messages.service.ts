import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';
import { TwilioService } from 'nestjs-twilio';
import { NestAppConfig } from '../configs/app.config.js';
import { TwilioConfig } from '../configs/twilio.config.js';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { OrderEntity } from '../moa-square/entities/order.entity.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly twilioService: TwilioService,
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly usersService: UsersService,
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
    userId: string;
    order: OrderEntity;
  }) {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

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
    userId: string;
    order: OrderEntity;
  }) {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

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
    userId: string;
    order: OrderEntity;
  }) {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

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
    userId: string;
    order: OrderEntity;
  }) {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

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
    userId: string;
    order: OrderEntity;
  }) {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

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
    userId: string;
    order: OrderEntity;
  }) {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

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
    userId: string;
    order: OrderEntity;
  }) {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

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
