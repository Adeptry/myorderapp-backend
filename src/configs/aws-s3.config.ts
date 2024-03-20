/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import { registerAs } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { IsOptional, IsString, validateSync } from 'class-validator';

export type AwsS3ConfigType = {
  accessKeyId?: string;
  secretAccessKey?: string;
  defaultBucket?: string;
  defaultUrl?: string;
  region?: string;
  maxFileSize: number;
};

class AwsS3ConfigValidator {
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

export const AwsS3Config = registerAs<AwsS3ConfigType>('awsS3', () => {
  const errors = validateSync(
    plainToClass(AwsS3ConfigValidator, process.env, {
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
});
