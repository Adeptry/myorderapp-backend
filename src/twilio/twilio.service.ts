import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);

  twilioClient = twilio(
    this.configService.getOrThrow('twilio.accountSid', {
      infer: true,
    }),
    this.configService.getOrThrow('twilio.authToken', {
      infer: true,
    }),
  );

  constructor(private configService: ConfigService) {}

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
