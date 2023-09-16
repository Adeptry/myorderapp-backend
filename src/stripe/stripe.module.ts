import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service.js';
import { StripeWebhookController } from './stripe.webhooks.controller.js';

@Module({
  imports: [],
  exports: [StripeService],
  controllers: [StripeWebhookController],
  providers: [StripeService],
})
export class StripeModule {}
