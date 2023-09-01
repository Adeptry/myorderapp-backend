import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe.webhooks.controller';

@Module({
  imports: [],
  exports: [StripeService],
  controllers: [StripeWebhookController],
  providers: [StripeService],
})
export class StripeModule {}
