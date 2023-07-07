import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);

  twilioClient = twilio(
    this.configService.get<string>('TWILIO_ACCOUNT_SID', {
      infer: true,
    }),
    this.configService.get<string>('TWILIO_AUTH_TOKEN', {
      infer: true,
    }),
  );

  constructor(private configService: ConfigService) {}

  async send(toPhone?: string, body?: string) {
    try {
      await this.twilioClient.messages.create(
        {
          body: body,
          from: this.configService.get<string>('TWILIO_FROM_PHONE', {
            infer: true,
          }),
          to: `${toPhone}`,
        },
        (error, item) => {
          if (error) {
            this.logger.error('Error sending sms', error, item);
          }
        },
      );
    } catch (e) {
      this.logger.error('Error sending email', e);
    }
  }
}
