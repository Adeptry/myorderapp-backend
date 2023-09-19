import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module.js';
import { StripeConfigUtils } from './stripe.config.utils.js';
import { StripeService } from './stripe.service.js';
import { StripeWebhookController } from './stripe.webhooks.controller.js';

@Module({
  imports: [LoggerModule],
  exports: [StripeService, StripeConfigUtils],
  controllers: [StripeWebhookController],
  providers: [StripeService, StripeConfigUtils],
})
export class StripeModule {}
