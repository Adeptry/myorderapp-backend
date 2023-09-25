import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';
import validateConfig from '../utils/validate-config.js';

export type AuthenticationConfig = {
  secret?: string;
  expires?: string;
  refreshSecret?: string;
  refreshExpires?: string;
};

class EnvironmentVariablesValidator {
  @IsString()
  AUTH_JWT_SECRET!: string;

  @IsString()
  AUTH_JWT_TOKEN_EXPIRES_IN!: string;

  @IsString()
  AUTH_REFRESH_SECRET!: string;

  @IsString()
  AUTH_REFRESH_TOKEN_EXPIRES_IN!: string;
}

export default registerAs<AuthenticationConfig>('auth', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    secret: process.env.AUTH_JWT_SECRET,
    expires: process.env.AUTH_JWT_TOKEN_EXPIRES_IN,
    refreshSecret: process.env.AUTH_REFRESH_SECRET,
    refreshExpires: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN,
  };
});
