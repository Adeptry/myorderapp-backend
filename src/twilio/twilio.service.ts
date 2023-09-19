import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { AppLogger } from '../logger/app.logger.js';

@Injectable()
export class TwilioService {
  twilioClient = twilio(
    this.configService.getOrThrow('twilio.accountSid', {
      infer: true,
    }),
    this.configService.getOrThrow('twilio.authToken', {
      infer: true,
    }),
  );

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TwilioService.name);
  }

  async send(toPhone?: string, body?: string) {
    try {
      await this.twilioClient.messages.create(
        {
          body: body,
          from: this.configService.getOrThrow('twilio.fromPhone', {
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
