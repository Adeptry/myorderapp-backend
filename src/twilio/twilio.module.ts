import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module.js';
import { TwilioService } from './twilio.service.js';

@Module({
  imports: [LoggerModule],
  exports: [TwilioService],
  providers: [TwilioService],
})
export class TwilioModule {}
