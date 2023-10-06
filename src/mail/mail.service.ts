import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';
import { SentMessageInfo } from 'nodemailer';
import { I18nTranslations } from 'src/i18n/i18n.generated.js';
import { RootConfigType } from '../app.config.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly service: MailerService,
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly configService: ConfigService<RootConfigType>,
  ) {}

  defaultTranslationOptions(): TranslateOptions {
    return {
      lang: I18nContext.current()?.lang,
      defaultValue: this.configService.get('app.fallbackLanguage', {
        infer: true,
      }),
    };
  }

  async sendForgotPasswordOrThrow(params: {
    to: {
      name?: string;
      address: string;
    };
    hash: string;
  }): Promise<SentMessageInfo> {
    const { to, hash } = params;
    const { name: toName, address } = to;

    this.logger.verbose(this.sendForgotPasswordOrThrow.name);

    const name =
      toName ??
      this.i18n.t('mail.defaultName', this.defaultTranslationOptions())!;

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
    const frontendUrl = this.configService.getOrThrow('app.frontendUrl', {
      infer: true,
    });

    const subject = this.i18n.t(
      'mailForgotPassword.subject',
      translationOptions,
    );
    const text = this.i18n.t('mailForgotPassword.text', translationOptions);
    const html = this.i18n.t('mailForgotPassword.html', translationOptions);
    const action = this.i18n.t('mailForgotPassword.action', translationOptions);

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

  async sendSupportRequestOrThrow(params: {
    to: {
      name?: string;
      address: string;
    };
    subject: string;
    text: string;
    bcc: string[];
  }): Promise<SentMessageInfo> {
    const { to, bcc } = params;
    const { name: toName, address } = to;
    this.logger.verbose(this.sendSupportRequestOrThrow.name);

    const name =
      toName ??
      this.i18n.t('mail.defaultName', this.defaultTranslationOptions())!;

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
      'mailSupportRequest.subject',
      translationOptions,
    );
    const sendText = this.i18n.t('mailSupportRequest.text', translationOptions);
    const html = this.i18n.t('mailSupportRequest.html', translationOptions);
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      return await this.service.sendMail({
        to: {
          name,
          address,
        },
        bcc,
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

  async sendContactOrThrow(params: {
    to: {
      name?: string;
      address: string;
    };
    subject: string;
    text: string;
    bcc: string[];
  }): Promise<SentMessageInfo> {
    const { to, bcc } = params;
    const { name: toName, address } = to;
    this.logger.verbose(this.sendContactOrThrow.name);

    const name =
      toName ??
      this.i18n.t('mail.defaultName', this.defaultTranslationOptions())!;

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
    const sendSubject = this.i18n.t('mailContact.subject', translationOptions);
    const sendText = this.i18n.t('mailContact.text', translationOptions);
    const html = this.i18n.t('mailContact.html', translationOptions);
    const footer = this.i18n.t('mail.footer', translationOptions);

    try {
      return await this.service.sendMail({
        to: {
          name,
          address,
        },
        bcc,
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
