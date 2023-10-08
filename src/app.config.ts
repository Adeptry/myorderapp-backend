import { AppConfigType } from './configs/app.config';
import { AwsS3ConfigType } from './configs/aws-s3.config';
import { MailerConfigType } from './configs/mailer.config';
import { TwilioConfigType } from './configs/twilio.config';
import { DatabaseConfigType } from './database/database.config';
import { MyOrderAppSquareConfigType } from './moa-square/moa-square.config';

export type RootConfigType = {
  app: AppConfigType;
  database: DatabaseConfigType;
  awsS3: AwsS3ConfigType;
  mailer: MailerConfigType;
  twilio: TwilioConfigType;
  moaSquare: MyOrderAppSquareConfigType;
};
