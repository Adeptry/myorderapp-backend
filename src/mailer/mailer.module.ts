import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module.js';
import { MailerService } from './mailer.service.js';

@Module({
  imports: [LoggerModule],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
