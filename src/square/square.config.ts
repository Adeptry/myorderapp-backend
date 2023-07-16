import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from 'src/utils/validate-config';

export type SquareConfig = {
  webhookSignatureKey: string;
  clientEnvironment: string;
  oauthClientId: string;
  oauthClientSecret: string;
};

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  SQUARE_WEBHOOK_SIGNATURE_KEY: string;
  @IsString()
  @IsOptional()
  SQUARE_OAUTH_CLIENT_ID: string;
  @IsString()
  @IsOptional()
  SQUARE_OAUTH_CLIENT_SECRET: string;
  @IsString()
  @IsOptional()
  SQUARE_CLIENT_ENVIRONMENT: string;
  @IsString()
  @IsOptional()
  SQUARE_BASE_URL: string;
}

export default registerAs('square', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    clientEnvironment: process.env.SQUARE_CLIENT_ENVIRONMENT,
    oauthClientId: process.env.SQUARE_OAUTH_CLIENT_ID,
    oauthClientSecret: process.env.SQUARE_OAUTH_CLIENT_SECRET,
    baseUrl: process.env.SQUARE_BASE_URL,
  };
});
