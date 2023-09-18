import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from '../utils/validate-config.js';

export type GoogleConfig = {
  clientId?: string;
  clientSecret?: string;
};

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;
}

export default registerAs<GoogleConfig>('google', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
});
