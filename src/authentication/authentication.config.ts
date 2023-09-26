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
