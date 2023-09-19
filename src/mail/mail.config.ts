import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from '../utils/validate-config.js';

export type MailConfig = {
  authApiKey?: string;
  authDomain?: string;
  defaultsFrom?: string;
};

class EnvironmentVariablesValidator {
  @IsOptional()
  @IsString()
  MAIL_AUTH_API_KEY?: string;

  @IsString()
  @IsOptional()
  MAIL_AUTH_DOMAIN?: string;

  @IsString()
  @IsOptional()
  MAIL_DEFAULTS_FROM?: string;
}

export default registerAs<MailConfig>('mail', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    authApiKey: process.env.MAIL_AUTH_API_KEY,
    authDomain: process.env.MAIL_AUTH_DOMAIN,
    defaultsFrom: process.env.MAIL_DEFAULTS_FROM,
  };
});
