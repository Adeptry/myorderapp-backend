import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module.js';

import { MailService } from './mail.service.js';

@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
