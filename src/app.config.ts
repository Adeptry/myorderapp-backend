import { AppConfigType } from './configs/app.config';
import { AwsS3ConfigType } from './configs/aws-s3.config';
import { MailerConfigType } from './configs/mailer.config';
import { DatabaseConfigType } from './database/database.config';
import { NestSquareConfigType } from './square/nest-square.config';

export type RootConfigType = {
  app: AppConfigType;
  database: DatabaseConfigType;
  awsS3: AwsS3ConfigType;
  mailer: MailerConfigType;
  square: NestSquareConfigType;
};
