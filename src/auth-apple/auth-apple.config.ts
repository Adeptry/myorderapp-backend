import { registerAs } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { IsJSON, IsOptional, validateSync } from 'class-validator';

export type AuthAppleConfigType = {
  appAudience: string[];
};

class AuthAppleConfigValidator {
  @IsJSON()
  @IsOptional()
  APPLE_APP_AUDIENCE?: string;
}

export const AuthAppleConfig = registerAs<AuthAppleConfigType>(
  'auth-apple',
  () => {
    const errors = validateSync(
      plainToClass(AuthAppleConfigValidator, process.env, {
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
      appAudience: JSON.parse(process.env.APPLE_APP_AUDIENCE ?? '[]'),
    };
  },
);
