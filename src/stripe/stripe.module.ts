import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module.js';
import { StripeService } from './stripe.service.js';
import { StripeWebhookController } from './stripe.webhooks.controller.js';

@Module({
  imports: [LoggerModule],
  exports: [StripeService],
  controllers: [StripeWebhookController],
  providers: [StripeService],
})
export class StripeModule {}
