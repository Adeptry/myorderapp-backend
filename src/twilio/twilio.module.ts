import { Module } from '@nestjs/common';
import { TwilioService } from './twilio.service';

@Module({
  imports: [],
  exports: [TwilioService],
  providers: [TwilioService],
})
export class TwilioModule {}
