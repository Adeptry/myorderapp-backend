import { registerAs } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { IsOptional, IsString, validateSync } from 'class-validator';

export type AwsS3FilesConfigType = {
  accessKeyId?: string;
  secretAccessKey?: string;
  defaultBucket?: string;
  defaultUrl?: string;
  region?: string;
  maxFileSize: number;
};

class AwsS3FilesConfigValidator {
  @IsString()
  @IsOptional()
  AWS_S3_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  AWS_S3_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  AWS_S3_DEFAULT_BUCKET?: string;

  @IsString()
  @IsOptional()
  AWS_S3_DEFAULT_URL?: string;

  @IsString()
  @IsOptional()
  AWS_S3_REGION?: string;
}

export const AwsS3FilesConfig = registerAs<AwsS3FilesConfigType>(
  'aws-s3-files',
  () => {
    const errors = validateSync(
      plainToClass(AwsS3FilesConfigValidator, process.env, {
        enableImplicitConversion: true,
      }),
      {
        skipMissingProperties: false,
      },
    );

    if (errors.length > 0) {
      throw new Error(errors.toString());
    }

    return {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      defaultBucket: process.env.AWS_S3_DEFAULT_BUCKET,
      defaultUrl: process.env.AWS_S3_DEFAULT_URL,
      region: process.env.AWS_S3_REGION,
      maxFileSize: 5242880, // 5mb
    };
  },
);
