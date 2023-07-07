import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TwilioService } from './twilio.service';

@Module({
  imports: [ConfigModule],
  exports: [TwilioService],
  providers: [TwilioService],
})
export class TwilioModule {}
