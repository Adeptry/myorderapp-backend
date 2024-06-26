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

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';
import { NestAppConfig } from '../configs/app.config.js';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service.js';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { MerchantEntity } from '../moa-square/entities/merchant.entity.js';
import { OrderEntity } from '../moa-square/entities/order.entity.js';

import firebaseAdminPkg from 'firebase-admin';

const { credential } = firebaseAdminPkg;

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    protected readonly i18n: I18nService<I18nTranslations>,
    private readonly firebaseAdminService: FirebaseAdminService,
    @Inject(NestAppConfig.KEY)
    private readonly configService: ConfigType<typeof NestAppConfig>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  protected defaultTranslationOptions(lang?: string | null): TranslateOptions {
    return {
      lang: lang ?? I18nContext.current()?.lang,
      defaultValue: this.configService.fallbackLanguage,
    };
  }

  async sendPostSquarePaymentOrderCurrentOrThrow(params: {
    order: OrderEntity;
  }) {
    const { order } = params;
    const { customer, merchant } = order;

    this.logger.log(this.sendPostSquarePaymentOrderCurrentOrThrow.name);

    if (!merchant) {
      throw new NotFoundException();
    }

    const appInstalls = customer?.appInstalls ?? [];
    const user = customer?.user;
    if (!(customer?.pushNotifications ?? false)) {
      this.logger.log("Customer doesn't want push notifications");
      return;
    }

    if (appInstalls.length === 0) {
      this.logger.error('Customer has no app installs');
      throw new NotFoundException('Customer has no app installs');
    }

    const app = this.firebaseAdminApp({ merchant });
    if (!app) {
      this.logger.error("Firebase app doesn't exist");
      throw new NotFoundException("Firebase app doesn't exist");
    }

    const messaging = this.firebaseAdminService.messaging(app);

    const title = this.i18n.t('push.postSquarePaymentOrderCurrent.title', {
      ...this.defaultTranslationOptions(user?.language),
      args: { order },
    });
    this.logger.log(`title: ${title}`);

    const body = this.i18n.t('push.postSquarePaymentOrderCurrent.body', {
      ...this.defaultTranslationOptions(user?.language),
      args: { order },
    });
    this.logger.log(`body: ${body}`);

    for (const appInstall of appInstalls) {
      if (!appInstall.firebaseCloudMessagingToken) {
        this.logger.log("App install doesn't have a token");
        continue;
      }
      this.logger.log('Sending');
      try {
        await messaging.send({
          token: appInstall.firebaseCloudMessagingToken,
          notification: {
            title,
            body,
          },
        });
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  async sendOnEventSquareFulfillmentUpdateCanceledOrThrow(params: {
    order: OrderEntity;
  }) {
    const { order } = params;
    const { customer, merchant } = order;

    this.logger.log(
      this.sendOnEventSquareFulfillmentUpdateCanceledOrThrow.name,
    );

    if (!merchant) {
      throw new NotFoundException();
    }

    const appInstalls = customer?.appInstalls ?? [];
    const user = customer?.user;
    if (!(customer?.pushNotifications ?? false)) {
      return;
    }

    if (appInstalls.length === 0) {
      this.logger.error('Customer has no app installs');
      throw new NotFoundException('Customer has no app installs');
    }

    const app = this.firebaseAdminApp({ merchant });
    if (!app) {
      this.logger.error("Firebase app doesn't exist");
      throw new NotFoundException("Firebase app doesn't exist");
    }

    const messaging = this.firebaseAdminService.messaging(app);

    const title = this.i18n.t(
      'push.onEventSquareFulfillmentUpdateCanceled.title',
      {
        ...this.defaultTranslationOptions(user?.language),
        args: { order },
      },
    );

    const body = this.i18n.t(
      'push.onEventSquareFulfillmentUpdateCanceled.body',
      {
        ...this.defaultTranslationOptions(user?.language),
        args: { order },
      },
    );

    for (const appInstall of appInstalls) {
      if (!appInstall.firebaseCloudMessagingToken) {
        continue;
      }
      try {
        await messaging.send({
          token: appInstall.firebaseCloudMessagingToken,
          notification: {
            title,
            body,
          },
        });
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  async sendOnEventSquareFulfillmentUpdateCompletedOrThrow(params: {
    order: OrderEntity;
  }) {
    const { order } = params;
    const { customer, merchant } = order;

    this.logger.log(
      this.sendOnEventSquareFulfillmentUpdateCompletedOrThrow.name,
    );

    if (!merchant) {
      throw new NotFoundException();
    }

    const appInstalls = customer?.appInstalls ?? [];
    const user = customer?.user;
    if (!(customer?.pushNotifications ?? false)) {
      return;
    }

    if (appInstalls.length === 0) {
      this.logger.error('Customer has no app installs');
      throw new NotFoundException('Customer has no app installs');
    }

    const app = this.firebaseAdminApp({ merchant });
    if (!app) {
      this.logger.error("Firebase app doesn't exist");
      throw new NotFoundException("Firebase app doesn't exist");
    }

    const messaging = this.firebaseAdminService.messaging(app);

    const title = this.i18n.t(
      'push.onEventSquareFulfillmentUpdateCompleted.title',
      {
        ...this.defaultTranslationOptions(user?.language),
        args: { order },
      },
    );

    const body = this.i18n.t(
      'push.onEventSquareFulfillmentUpdateCompleted.body',
      {
        ...this.defaultTranslationOptions(user?.language),
        args: { order },
      },
    );

    for (const appInstall of appInstalls) {
      if (!appInstall.firebaseCloudMessagingToken) {
        continue;
      }
      try {
        await messaging.send({
          token: appInstall.firebaseCloudMessagingToken,
          notification: {
            title,
            body,
          },
        });
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  async sendOnEventSquareFulfillmentUpdateFailedOrThrow(params: {
    order: OrderEntity;
  }) {
    const { order } = params;
    const { customer, merchant } = order;

    this.logger.log(this.sendOnEventSquareFulfillmentUpdateFailedOrThrow.name);

    if (!merchant) {
      throw new NotFoundException();
    }

    const appInstalls = customer?.appInstalls ?? [];
    const user = customer?.user;
    if (!(customer?.pushNotifications ?? false)) {
      return;
    }

    if (appInstalls.length === 0) {
      this.logger.error('Customer has no app installs');
      throw new NotFoundException('Customer has no app installs');
    }

    const app = this.firebaseAdminApp({ merchant });
    if (!app) {
      this.logger.error("Firebase app doesn't exist");
      throw new NotFoundException("Firebase app doesn't exist");
    }

    const messaging = this.firebaseAdminService.messaging(app);

    const title = this.i18n.t(
      'push.onEventSquareFulfillmentUpdateFailed.title',
      {
        ...this.defaultTranslationOptions(user?.language),
        args: { order },
      },
    );

    const body = this.i18n.t('push.onEventSquareFulfillmentUpdateFailed.body', {
      ...this.defaultTranslationOptions(user?.language),
      args: { order },
    });

    for (const appInstall of appInstalls) {
      if (!appInstall.firebaseCloudMessagingToken) {
        continue;
      }
      try {
        await messaging.send({
          token: appInstall.firebaseCloudMessagingToken,
          notification: {
            title,
            body,
          },
        });
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  async sendOnEventSquareFulfillmentUpdatePreparedOrThrow(params: {
    order: OrderEntity;
  }) {
    const { order } = params;
    const { customer, merchant } = order;

    this.logger.log(
      this.sendOnEventSquareFulfillmentUpdatePreparedOrThrow.name,
    );

    if (!merchant) {
      throw new NotFoundException();
    }

    const appInstalls = customer?.appInstalls ?? [];
    const user = customer?.user;
    if (!(customer?.pushNotifications ?? false)) {
      return;
    }

    if (appInstalls.length === 0) {
      this.logger.error('Customer has no app installs');
      throw new NotFoundException('Customer has no app installs');
    }

    const app = this.firebaseAdminApp({ merchant });
    if (!app) {
      this.logger.error("Firebase app doesn't exist");
      throw new NotFoundException("Firebase app doesn't exist");
    }

    const messaging = this.firebaseAdminService.messaging(app);

    const title = this.i18n.t(
      'push.onEventSquareFulfillmentUpdatePrepared.title',
      {
        ...this.defaultTranslationOptions(user?.language),
        args: { order },
      },
    );

    const body = this.i18n.t(
      'push.onEventSquareFulfillmentUpdatePrepared.body',
      {
        ...this.defaultTranslationOptions(user?.language),
        args: { order },
      },
    );

    for (const appInstall of appInstalls) {
      if (!appInstall.firebaseCloudMessagingToken) {
        continue;
      }
      try {
        await messaging.send({
          token: appInstall.firebaseCloudMessagingToken,
          notification: {
            title,
            body,
          },
        });
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  async sendOnEventSquareFulfillmentUpdateProposedOrThrow(params: {
    order: OrderEntity;
  }) {
    const { order } = params;
    const { customer, merchant } = order;

    this.logger.log(
      this.sendOnEventSquareFulfillmentUpdateProposedOrThrow.name,
    );

    if (!merchant) {
      throw new NotFoundException();
    }

    const appInstalls = customer?.appInstalls ?? [];
    const user = customer?.user;
    if (!(customer?.pushNotifications ?? false)) {
      return;
    }

    if (appInstalls.length === 0) {
      this.logger.error('Customer has no app installs');
      throw new NotFoundException('Customer has no app installs');
    }

    const app = this.firebaseAdminApp({ merchant });
    if (!app) {
      this.logger.error("Firebase app doesn't exist");
      throw new NotFoundException("Firebase app doesn't exist");
    }

    const messaging = this.firebaseAdminService.messaging(app);

    const title = this.i18n.t(
      'push.onEventSquareFulfillmentUpdateProposed.title',
      {
        ...this.defaultTranslationOptions(user?.language),
        args: { order },
      },
    );

    const body = this.i18n.t(
      'push.onEventSquareFulfillmentUpdateProposed.body',
      {
        ...this.defaultTranslationOptions(user?.language),
        args: { order },
      },
    );

    for (const appInstall of appInstalls) {
      if (!appInstall.firebaseCloudMessagingToken) {
        continue;
      }
      try {
        await messaging.send({
          token: appInstall.firebaseCloudMessagingToken,
          notification: {
            title,
            body,
          },
        });
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  async sendOnEventSquareFulfillmentUpdateReservedOrThrow(params: {
    order: OrderEntity;
  }) {
    const { order } = params;
    const { customer, merchant } = order;

    this.logger.log(
      this.sendOnEventSquareFulfillmentUpdateReservedOrThrow.name,
    );

    if (!merchant) {
      this.logger.error('No merchant');
      throw new NotFoundException();
    }

    const appInstalls = customer?.appInstalls ?? [];
    const user = customer?.user;
    if (!(customer?.pushNotifications ?? false)) {
      this.logger.error('Customer doesnt want pushes');
      return;
    }

    if (appInstalls.length === 0) {
      this.logger.error('Customer has no app installs');
      throw new NotFoundException('Customer has no app installs');
    }

    const app = this.firebaseAdminApp({ merchant });
    if (!app) {
      this.logger.error("Firebase app doesn't exist");
      throw new NotFoundException("Firebase app doesn't exist");
    }

    const messaging = this.firebaseAdminService.messaging(app);

    const title = this.i18n.t(
      'push.onEventSquareFulfillmentUpdateReserved.title',
      {
        ...this.defaultTranslationOptions(user?.language),
        args: { order },
      },
    );
    this.logger.log(`title: ${title}`);

    const body = this.i18n.t(
      'push.onEventSquareFulfillmentUpdateReserved.body',
      {
        ...this.defaultTranslationOptions(user?.language),
        args: { order },
      },
    );
    this.logger.log(`body: ${body}`);

    for (const appInstall of appInstalls) {
      if (!appInstall.firebaseCloudMessagingToken) {
        continue;
      }
      this.logger.log('send');
      try {
        await messaging.send({
          token: appInstall.firebaseCloudMessagingToken,
          notification: {
            title,
            body,
          },
        });
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  firebaseAdminApp(params: { merchant: MerchantEntity }) {
    const { merchant } = params;
    const { firebaseAppOptions, id } = merchant;

    this.logger.verbose(this.firebaseAdminApp.name);

    if (!firebaseAppOptions || !id) {
      this.logger.error('Firebase app options not found');
      throw new NotFoundException('Firebase app options not found');
    }

    try {
      return this.firebaseAdminService.getApp(id);
    } catch (error) {
      // do nothing, the app doesn't exist
      this.logger.log(error);
    }
    try {
      const appOptions = JSON.parse(JSON.stringify(firebaseAppOptions));
      const app = this.firebaseAdminService.initializeApp(
        {
          credential: credential.cert(appOptions),
        },
        id,
      );
      return app;
    } catch (error: any) {
      this.logger.log(error);
      return null;
    }
  }
}
