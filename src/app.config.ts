import { registerAs } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

export type NestAppConfigType = {
  nodeEnv: string;
  name: string;
  workingDirectory: string;
  frontendUrl: string;
  backendUrl: string;
  corsOriginRegExp: string;
  port: number;
  apiPrefix?: string;
  fallbackLanguage: string;
  headerLanguage: string;
  headerApiKey: string;
};

class NestAppConfigValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT?: number;

  @IsUrl({ require_tld: false })
  APP_FRONTEND_URL!: string;

  @IsUrl({ require_tld: false })
  APP_BACKEND_URL!: string;

  @IsString()
  APP_CORS_ORIGIN_REG_EXP!: string;

  @IsString()
  @IsOptional()
  APP_API_PREFIX?: string;

  @IsString()
  @IsOptional()
  APP_FALLBACK_LANGUAGE!: string;

  @IsString()
  @IsOptional()
  APP_HEADER_LANGUAGE!: string;

  @IsString()
  @IsOptional()
  APP_HEADER_API_KEY!: string;
}

export const NestAppConfig = registerAs<NestAppConfigType>('app', () => {
  const errors = validateSync(
    plainToClass(NestAppConfigValidator, process.env, {
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
    nodeEnv: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'app',
    workingDirectory: process.env.PWD || process.cwd(),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    frontendUrl: process.env.APP_FRONTEND_URL!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    backendUrl: process.env.APP_BACKEND_URL!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    corsOriginRegExp: process.env.APP_CORS_ORIGIN_REG_EXP!,
    port: process.env.PORT
      ? parseInt(process.env.PORT, 10)
      : process.env.PORT
      ? parseInt(process.env.PORT, 10)
      : 3000,
    apiPrefix: process.env.APP_API_PREFIX,
    fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || 'en',
    headerLanguage: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
    headerApiKey: process.env.APP_HEADER_API_KEY || 'Api-Key',
  };
});
