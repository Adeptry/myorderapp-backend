import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Module({
  imports: [],
  exports: [StripeService],
  providers: [StripeService],
})
export class StripeModule {}
