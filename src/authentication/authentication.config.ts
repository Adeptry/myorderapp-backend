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
import { IsString, validateSync } from 'class-validator';

export type AuthenticationConfigType = {
  apiKeys: string[];
  secret: string;
  expires: string;
  refreshSecret: string;
  refreshExpires: string;
};

class AuthenticationConfigValidator {
  @IsString()
  AUTH_API_KEYS!: string;

  @IsString()
  AUTH_JWT_SECRET!: string;

  @IsString()
  AUTH_JWT_TOKEN_EXPIRES_IN!: string;

  @IsString()
  AUTH_REFRESH_SECRET!: string;

  @IsString()
  AUTH_REFRESH_TOKEN_EXPIRES_IN!: string;
}

export const AuthenticationConfig = registerAs<AuthenticationConfigType>(
  'auth',
  () => {
    const errors = validateSync(
      plainToClass(AuthenticationConfigValidator, process.env, {
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
      apiKeys: process.env.AUTH_API_KEYS?.split(',') || [],
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      secret: process.env.AUTH_JWT_SECRET!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expires: process.env.AUTH_JWT_TOKEN_EXPIRES_IN!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      refreshSecret: process.env.AUTH_REFRESH_SECRET!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      refreshExpires: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN!,
    };
  },
);
