import { Module } from '@nestjs/common';
import { TwilioService } from './twilio.service.js';

@Module({
  imports: [],
  exports: [TwilioService],
  providers: [TwilioService],
})
export class TwilioModule {}
