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
