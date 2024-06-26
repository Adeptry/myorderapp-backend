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

import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';
import { RootConfigType } from '../app.config.js';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { MerchantEntity } from '../moa-square/entities/merchant.entity.js';
import { OrderEntity } from '../moa-square/entities/order.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly service: MailerService,
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly configService: ConfigService<RootConfigType>,
    private readonly usersService: UsersService,
  ) {}

  defaultTranslationOptions(lang?: string | null): TranslateOptions {
    return {
      lang: lang ?? I18nContext.current()?.lang,
      defaultValue: this.configService.get('app.fallbackLanguage', {
        infer: true,
      }),
    };
  }

  async sendPostPasswordForgotOrThrow(params: {
    user: UserEntity;
    hash: string;
  }): Promise<void> {
    const { user, hash } = params;

    this.logger.verbose(this.sendPostPasswordForgotOrThrow.name);

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(user.language),
      args: {
        ...params,
        to: {
          name,
          address,
        },
      },
    };
    const frontendUrl = this.configService.getOrThrow('app.frontendUrl', {
      infer: true,
    });

    const subject = this.i18n.t(
      'mail.postPasswordForgot.subject',
      translationOptions,
    );
    const text = this.i18n.t(
      'mail.postPasswordForgot.text',
      translationOptions,
    );
    const html = this.i18n.t(
      'mail.postPasswordForgot.html',
      translationOptions,
    );
    const action = this.i18n.t(
      'mail.postPasswordForgot.action',
      translationOptions,
    );

    const footer = this.i18n.t('mail.footer', translationOptions);
    const href = `${frontendUrl}/reset-password/confirm?hash=${hash}`;

    try {
      await this.service.sendMail({
        to: {
          name: name,
          address,
        },
        subject,
        text,
        template: 'button',
        context: {
          title: subject,
          preheader: text,
          html,
          text,
          href,
          action,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendPostSupportOrThrow(params: {
    user: UserEntity;
    subject: string;
    text: string;
  }): Promise<void> {
    const { user } = params;

    const address = user.email!;
    this.logger.verbose(this.sendPostSupportOrThrow.name);

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
      },
    };
    const sendSubject = this.i18n.t(
      'mail.postSupport.subject',
      translationOptions,
    );
    const sendText = this.i18n.t('mail.postSupport.text', translationOptions);
    const html = this.i18n.t('mail.postSupport.html', translationOptions);
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        bcc: (await this.usersService.findAdmins()).map(
          (admin) => admin.email!,
        ),
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendPostContactOrThrow(params: {
    user: UserEntity;
    subject: string;
    text: string;
  }): Promise<void> {
    const { user } = params;

    this.logger.verbose(this.sendPostContactOrThrow.name);

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
      },
    };
    const sendSubject = this.i18n.t(
      'mail.postContact.subject',
      translationOptions,
    );
    const sendText = this.i18n.t('mail.postContact.text', translationOptions);
    const html = this.i18n.t('mail.postContact.html', translationOptions);
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        bcc: (await this.usersService.findAdmins()).map(
          (admin) => admin.email!,
        ),
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendPostMerchantMeOrThrow(params: { user: UserEntity }): Promise<void> {
    const { user } = params;

    this.logger.verbose(this.sendPostMerchantMeOrThrow.name);

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
        supportEmail: this.configService.getOrThrow('app.supportEmail', {
          infer: true,
        }),
      },
    };
    const sendSubject = this.i18n.t(
      'mail.postMerchantMe.subject',
      translationOptions,
    );
    const sendText = this.i18n.t(
      'mail.postMerchantMe.text',
      translationOptions,
    );
    const html = this.i18n.t('mail.postMerchantMe.html', translationOptions);
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        bcc: (await this.usersService.findAdmins()).map(
          (admin) => admin.email!,
        ),
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendPostCustomerMeOrThrow(params: {
    user: UserEntity;
    merchant: MerchantEntity;
  }): Promise<void> {
    const { user, merchant } = params;

    this.logger.verbose(this.sendPostCustomerMeOrThrow.name);

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
        supportEmail: this.configService.getOrThrow('app.supportEmail', {
          infer: true,
        }),
        merchant,
      },
    };
    const sendSubject = this.i18n.t(
      'mail.postCustomerMe.subject',
      translationOptions,
    );
    const sendText = this.i18n.t(
      'mail.postCustomerMe.text',
      translationOptions,
    );
    const html = this.i18n.t('mail.postCustomerMe.html', translationOptions);
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendDeleteMerchantMeOrThrow(params: {
    user: UserEntity;
  }): Promise<void> {
    const { user } = params;

    this.logger.verbose(this.sendDeleteMerchantMeOrThrow.name);

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
        supportEmail: this.configService.getOrThrow('app.supportEmail', {
          infer: true,
        }),
      },
    };
    const sendSubject = this.i18n.t(
      'mail.deleteMerchantMe.subject',
      translationOptions,
    );
    const sendText = this.i18n.t(
      'mail.deleteMerchantMe.text',
      translationOptions,
    );
    const html = this.i18n.t('mail.deleteMerchantMe.html', translationOptions);
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        bcc: (await this.usersService.findAdmins()).map(
          (admin) => admin.email!,
        ),
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendDeleteCustomerMeOrThrow(params: {
    user: UserEntity;
    merchant: MerchantEntity;
  }): Promise<void> {
    const { user, merchant } = params;

    this.logger.verbose(this.sendDeleteCustomerMeOrThrow.name);

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
        supportEmail: this.configService.getOrThrow('app.supportEmail', {
          infer: true,
        }),
        merchant,
      },
    };
    const sendSubject = this.i18n.t(
      'mail.deleteCustomerMe.subject',
      translationOptions,
    );
    const sendText = this.i18n.t(
      'mail.deleteCustomerMe.text',
      translationOptions,
    );
    const html = this.i18n.t('mail.deleteCustomerMe.html', translationOptions);
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendPostSquarePaymentOrderCurrentOrThrow(params: {
    order: OrderEntity;
  }): Promise<void> {
    const { order } = params;
    const { customer } = order;
    const user = customer?.user;

    if (!user || !(customer.mailNotifications ?? false)) {
      throw new NotFoundException();
    }

    this.logger.verbose(this.sendPostSquarePaymentOrderCurrentOrThrow.name);

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
        order,
      },
    };
    const sendSubject = this.i18n.t(
      'mail.postSquarePaymentOrderCurrent.subject',
      translationOptions,
    );
    const sendText = this.i18n.t(
      'mail.postSquarePaymentOrderCurrent.text',
      translationOptions,
    );
    const html = this.i18n.t(
      'mail.postSquarePaymentOrderCurrent.html',
      translationOptions,
    );
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendOnEventSquareFulfillmentUpdateCanceledOrThrow(params: {
    order: OrderEntity;
  }): Promise<void> {
    const { order } = params;
    const { customer } = order;
    const user = customer?.user;

    if (!user || !(customer.mailNotifications ?? false)) {
      throw new NotFoundException();
    }

    this.logger.verbose(
      this.sendOnEventSquareFulfillmentUpdateCanceledOrThrow.name,
    );

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
        order,
      },
    };
    const sendSubject = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateCanceled.subject',
      translationOptions,
    );
    const sendText = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateCanceled.text',
      translationOptions,
    );
    const html = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateCanceled.html',
      translationOptions,
    );
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendOnEventSquareFulfillmentUpdateCompletedOrThrow(params: {
    order: OrderEntity;
  }): Promise<void> {
    const { order } = params;
    const { customer } = order;
    const user = customer?.user;

    if (!user || !(customer.mailNotifications ?? false)) {
      throw new NotFoundException();
    }

    this.logger.verbose(
      this.sendOnEventSquareFulfillmentUpdateCompletedOrThrow.name,
    );

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
        order,
      },
    };
    const sendSubject = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateCompleted.subject',
      translationOptions,
    );
    const sendText = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateCompleted.text',
      translationOptions,
    );
    const html = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateCompleted.html',
      translationOptions,
    );
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendOnEventSquareFulfillmentUpdateFailedOrThrow(params: {
    order: OrderEntity;
  }): Promise<void> {
    const { order } = params;
    const { customer } = order;
    const user = customer?.user;

    if (!user || !(customer.mailNotifications ?? false)) {
      throw new NotFoundException();
    }

    this.logger.verbose(
      this.sendOnEventSquareFulfillmentUpdateFailedOrThrow.name,
    );

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
        order,
      },
    };
    const sendSubject = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateFailed.subject',
      translationOptions,
    );
    const sendText = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateFailed.text',
      translationOptions,
    );
    const html = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateFailed.html',
      translationOptions,
    );
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendOnEventSquareFulfillmentUpdatePreparedOrThrow(params: {
    order: OrderEntity;
  }): Promise<void> {
    const { order } = params;
    const { customer } = order;
    const user = customer?.user;

    if (!user || !(customer.mailNotifications ?? false)) {
      throw new NotFoundException();
    }

    this.logger.verbose(
      this.sendOnEventSquareFulfillmentUpdatePreparedOrThrow.name,
    );

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
        order,
      },
    };
    const sendSubject = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdatePrepared.subject',
      translationOptions,
    );
    const sendText = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdatePrepared.text',
      translationOptions,
    );
    const html = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdatePrepared.html',
      translationOptions,
    );
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendOnEventSquareFulfillmentUpdateProposedOrThrow(params: {
    order: OrderEntity;
  }): Promise<void> {
    const { order } = params;
    const { customer } = order;
    const user = customer?.user;

    if (!user || !(customer.mailNotifications ?? false)) {
      throw new NotFoundException();
    }

    this.logger.verbose(
      this.sendOnEventSquareFulfillmentUpdateProposedOrThrow.name,
    );

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
        order,
      },
    };
    const sendSubject = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateProposed.subject',
      translationOptions,
    );
    const sendText = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateProposed.text',
      translationOptions,
    );
    const html = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateProposed.html',
      translationOptions,
    );
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendOnEventSquareFulfillmentUpdateReservedOrThrow(params: {
    order: OrderEntity;
  }): Promise<void> {
    const { order } = params;
    const { customer } = order;
    const user = customer?.user;

    if (!user || !(customer.mailNotifications ?? false)) {
      throw new NotFoundException();
    }

    this.logger.verbose(
      this.sendOnEventSquareFulfillmentUpdateReservedOrThrow.name,
    );

    const name =
      user.fullName ??
      this.i18n.t(
        'mail.defaultName',
        this.defaultTranslationOptions(user.language),
      )!;
    const address = user.email!;

    const translationOptions: TranslateOptions = {
      ...this.defaultTranslationOptions(),
      args: {
        ...params,
        to: {
          name,
          address,
        },
        order,
      },
    };
    const sendSubject = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateReserved.subject',
      translationOptions,
    );
    const sendText = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateReserved.text',
      translationOptions,
    );
    const html = this.i18n.t(
      'mail.onEventSquareFulfillmentUpdateReserved.html',
      translationOptions,
    );
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      await this.service.sendMail({
        to: {
          name,
          address,
        },
        subject: sendSubject,
        text: sendText,
        template: 'base',
        context: {
          title: sendSubject,
          preheader: sendText,
          html,
          text: sendText,
          footer,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendAdminMailOrThrow(params: {
    subject: string;
    text: string;
  }): Promise<void> {
    const { subject, text } = params;

    this.logger.verbose(this.sendAdminMailOrThrow.name);

    try {
      await this.service.sendMail({
        to: (await this.usersService.findAdmins()).map((admin) => admin.email!),
        subject: subject,
        text: text,
        template: 'base',
        context: {
          title: subject,
          preheader: text,
          html: text,
          text: text,
          footer: '',
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
