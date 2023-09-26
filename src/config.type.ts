import { NestAppConfigType } from './app.config.js';
import { AwsS3FilesConfigType } from './aws-s3-files/aws-s3-files.config.js';
import { DatabaseConfigType } from './database/database.config.js';
import { MailerConfigType } from './mailer.config.js';

export type AllConfigType = {
  app: NestAppConfigType;
  database: DatabaseConfigType;
  awsS3: AwsS3FilesConfigType;
  mailer: MailerConfigType;
};
