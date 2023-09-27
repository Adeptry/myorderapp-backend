import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';
import { SentMessageInfo } from 'nodemailer';
import { RootConfigType } from '../app.config.js';
import { UserEntity } from '../users/entities/user.entity.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService<RootConfigType>,
  ) {}

  async sendForgotPasswordOrThrow(params: {
    to: string;
    args: { user: UserEntity; hash: string };
  }): Promise<SentMessageInfo> {
    const { to, args } = params;
    this.logger.verbose(this.sendForgotPasswordOrThrow.name);

    const translationOptions: TranslateOptions = {
      lang: I18nContext.current()?.lang,
      defaultValue: this.configService.get('app.fallbackLanguage', {
        infer: true,
      }),
      args: args,
      debug: true,
    };
    const frontendUrl = this.configService.getOrThrow('app.frontendUrl', {
      infer: true,
    });

    const subject = this.i18n.t(
      'forgotPasswordEmail.subject',
      translationOptions,
    );
    const text = this.i18n.t('forgotPasswordEmail.text', translationOptions);
    const html = this.i18n.t('forgotPasswordEmail.html', translationOptions);
    const action = this.i18n.t(
      'forgotPasswordEmail.action',
      translationOptions,
    );
    const footer = this.i18n.t('common.emailFooter', translationOptions);
    const href = `${frontendUrl}/reset-password/confirm?hash=${args.hash}`;

    try {
      return await this.mailerService.sendMail({
        to: to,
        subject: subject,
        text: text,
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
}
