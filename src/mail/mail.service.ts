import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';
import { SentMessageInfo } from 'nodemailer';
import { RootConfigType } from '../app.config.js';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { MerchantEntity } from '../moa-square/entities/merchant.entity.js';
import { OrderEntity } from '../moa-square/entities/order.entity.js';
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
    userId: string;
    hash: string;
  }): Promise<SentMessageInfo> {
    const { userId, hash } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

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
      return await this.service.sendMail({
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
    userId: string;
    subject: string;
    text: string;
  }): Promise<SentMessageInfo> {
    const { userId } = params;

    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

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
      return await this.service.sendMail({
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
    userId: string;
    subject: string;
    text: string;
  }): Promise<SentMessageInfo> {
    const { userId } = params;

    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

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
      return await this.service.sendMail({
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

  async sendPostMerchantMeOrThrow(params: {
    userId: string;
  }): Promise<SentMessageInfo> {
    const { userId } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

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
      return await this.service.sendMail({
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
    userId: string;
    merchant: MerchantEntity;
  }): Promise<SentMessageInfo> {
    const { userId, merchant } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

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
      return await this.service.sendMail({
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

  async sendPostSquarePaymentOrderCurrent(params: {
    userId: string;
    order: OrderEntity;
  }): Promise<SentMessageInfo> {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

    this.logger.verbose(this.sendPostSquarePaymentOrderCurrent.name);

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
      return await this.service.sendMail({
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

  async sendOnEventSquareFulfillmentUpdateCanceled(params: {
    userId: string;
    order: OrderEntity;
  }): Promise<SentMessageInfo> {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

    this.logger.verbose(this.sendOnEventSquareFulfillmentUpdateCanceled.name);

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
      return await this.service.sendMail({
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

  async sendOnEventSquareFulfillmentUpdateCompleted(params: {
    userId: string;
    order: OrderEntity;
  }): Promise<SentMessageInfo> {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

    this.logger.verbose(this.sendOnEventSquareFulfillmentUpdateCompleted.name);

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
      return await this.service.sendMail({
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

  async sendOnEventSquareFulfillmentUpdateFailed(params: {
    userId: string;
    order: OrderEntity;
  }): Promise<SentMessageInfo> {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

    this.logger.verbose(this.sendOnEventSquareFulfillmentUpdateFailed.name);

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
      return await this.service.sendMail({
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

  async sendOnEventSquareFulfillmentUpdatePrepared(params: {
    userId: string;
    order: OrderEntity;
  }): Promise<SentMessageInfo> {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

    this.logger.verbose(this.sendOnEventSquareFulfillmentUpdatePrepared.name);

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
      return await this.service.sendMail({
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

  async sendOnEventSquareFulfillmentUpdateProposed(params: {
    userId: string;
    order: OrderEntity;
  }): Promise<SentMessageInfo> {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

    this.logger.verbose(this.sendOnEventSquareFulfillmentUpdateProposed.name);

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
      return await this.service.sendMail({
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

  async sendOnEventSquareFulfillmentUpdateReserved(params: {
    userId: string;
    order: OrderEntity;
  }): Promise<SentMessageInfo> {
    const { userId, order } = params;
    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

    this.logger.verbose(this.sendOnEventSquareFulfillmentUpdateReserved.name);

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
      return await this.service.sendMail({
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
}
