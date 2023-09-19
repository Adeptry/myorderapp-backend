import { AppConfig } from './app.config.js';
import { AppleConfig } from './auth-apple/apple.config.js';
import { GoogleConfig } from './auth-google/google.config.js';
import { AuthConfig } from './auth/auth.config.js';
import { DatabaseConfig } from './database/database.config.js';
import { FileConfig } from './files/file.config.js';
import { MailConfig } from './mail/mail.config.js';
import { SquareConfig } from './square/square.config.js';
import { StripeConfig } from './stripe/stripe.config.js';
import { TwilioConfig } from './twilio/twilio.config.js';

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
