import { AppConfig } from './app.config';
import { AppleConfig } from './auth-apple/apple.config';
import { GoogleConfig } from './auth-google/google.config';
import { AuthConfig } from './auth/auth.config';
import { DatabaseConfig } from './database/database.config';
import { FileConfig } from './files/file.config';
import { MailConfig } from './mailer/mail.config';
import { SquareConfig } from './square/square.config';
import { StripeConfig } from './stripe/stripe.config';
import { TwilioConfig } from './twilio/twilio.config';

export type AllConfigType = {
  app: AppConfig;
  apple: AppleConfig;
  auth: AuthConfig;
  database: DatabaseConfig;
  file: FileConfig;
  google: GoogleConfig;
  mail: MailConfig;
  twilio: TwilioConfig;
  stripe: StripeConfig;
  square: SquareConfig;
};
