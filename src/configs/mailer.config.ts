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

export type MailerConfigType = {
  authApiKey: string;
  authDomain: string;
  defaultsFrom: string;
};

class MailerConfigValidator {
  @IsString()
  MAILER_AUTH_API_KEY!: string;

  @IsString()
  MAILER_AUTH_DOMAIN!: string;

  @IsString()
  MAILER_DEFAULTS_FROM!: string;
}

export const MailerConfig = registerAs<MailerConfigType>('mailer', () => {
  const errors = validateSync(
    plainToClass(MailerConfigValidator, process.env, {
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    authApiKey: process.env.MAILER_AUTH_API_KEY!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    authDomain: process.env.MAILER_AUTH_DOMAIN!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    defaultsFrom: process.env.MAILER_DEFAULTS_FROM!,
  };
});
