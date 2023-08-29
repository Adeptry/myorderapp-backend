import { registerAs } from '@nestjs/config';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import validateConfig from 'src/utils/validate-config';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

export type AppConfig = {
  nodeEnv: string;
  name: string;
  workingDirectory: string;
  frontendUrl?: string;
  backendUrl: string;
  corsOriginRegExp: string;
  port: number;
  apiPrefix?: string;
  fallbackLanguage: string;
  headerLanguage: string;
};

class EnvironmentVariablesValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT: number;

  @IsUrl({ require_tld: false })
  @IsOptional()
  FRONTEND_URL: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  BACKEND_URL: string;

  @IsString()
  CORS_ORIGIN_REG_EXP: string;

  @IsString()
  @IsOptional()
  API_PREFIX: string;

  @IsString()
  @IsOptional()
  APP_FALLBACK_LANGUAGE: string;

  @IsString()
  @IsOptional()
  APP_HEADER_LANGUAGE: string;

  @IsString()
  @IsOptional()
  HEADER_KEY_API_KEY: string;

  @IsString()
  @IsOptional()
  API_KEYS: string;
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'app',
    workingDirectory: process.env.PWD || process.cwd(),
    frontendUrl: process.env.FRONTEND_URL,
    backendUrl: process.env.BACKEND_URL ?? 'http://localhost',
    corsOriginRegExp: process.env.CORS_ORIGIN_REG_EXP ?? '(localhost)',
    port: process.env.PORT
      ? parseInt(process.env.PORT, 10)
      : process.env.PORT
      ? parseInt(process.env.PORT, 10)
      : 3000,
    apiPrefix: process.env.API_PREFIX,
    fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || 'en',
    headerLanguage: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
    apiKeys: process.env.API_KEYS,
    headerKeyApiKey: process.env.HEADER_KEY_API_KEY,
  };
});
