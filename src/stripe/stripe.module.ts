import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeConfig } from './stripe.config.js';
import { StripeService } from './stripe.service.js';
import { StripeWebhookController } from './stripe.webhooks.controller.js';

@Module({
  imports: [ConfigModule.forFeature(StripeConfig)],
  exports: [StripeService],
  controllers: [StripeWebhookController],
  providers: [StripeService],
})
export class StripeModule {}
