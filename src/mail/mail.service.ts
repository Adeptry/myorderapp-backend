import { Injectable, Logger } from '@nestjs/common';
import { MailData } from './interfaces/mail-data.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  userSignUp(mailData: MailData<{ hash: string }>) {
    this.logger.log(`Sending email to ${mailData.to}...`);
  }

  forgotPassword(mailData: MailData<{ hash: string }>) {
    this.logger.log(`Sending email to ${mailData.to}...`);
  }
}
