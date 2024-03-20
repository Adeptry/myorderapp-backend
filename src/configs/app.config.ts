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
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

export type AppConfigType = {
  nodeEnv: string;
  name: string;
  supportEmail: string;
  workingDirectory: string;
  frontendUrl: string;
  backendUrl: string;
  corsOriginRegExp: string;
  port: number;
  apiPrefix?: string;
  fallbackLanguage: string;
  headerLanguage: string;
  headerApiKey: string;
};

class NestAppConfigValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT?: number;

  @IsUrl({ require_tld: false })
  APP_FRONTEND_URL!: string;

  @IsUrl({ require_tld: false })
  APP_BACKEND_URL!: string;

  @IsString()
  APP_CORS_ORIGIN_REG_EXP!: string;

  @IsString()
  @IsOptional()
  APP_API_PREFIX?: string;

  @IsString()
  @IsOptional()
  APP_FALLBACK_LANGUAGE!: string;

  @IsString()
  @IsOptional()
  APP_HEADER_LANGUAGE!: string;

  @IsString()
  @IsOptional()
  APP_HEADER_API_KEY!: string;

  @IsString()
  @IsOptional()
  APP_SUPPORT_EMAIL!: string;
}

export const NestAppConfig = registerAs<AppConfigType>('app', () => {
  const errors = validateSync(
    plainToClass(NestAppConfigValidator, process.env, {
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
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT
      ? parseInt(process.env.PORT, 10)
      : process.env.PORT
        ? parseInt(process.env.PORT, 10)
        : 3000,
    workingDirectory: process.env.PWD || process.cwd(),
    name: process.env.APP_NAME || 'app',
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    frontendUrl: process.env.APP_FRONTEND_URL!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    backendUrl: process.env.APP_BACKEND_URL!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    corsOriginRegExp: process.env.APP_CORS_ORIGIN_REG_EXP!,
    apiPrefix: process.env.APP_API_PREFIX,
    fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || 'en',
    headerLanguage: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
    headerApiKey: process.env.APP_HEADER_API_KEY || 'Api-Key',
    supportEmail: process.env.APP_SUPPORT_EMAIL!,
  };
});
