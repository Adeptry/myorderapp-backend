import { registerAs } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { IsOptional, IsString, validateSync } from 'class-validator';

export type SquareConfigType = {
  clientEnvironment: string;
  oauthClientId: string;
  oauthClientSecret: string;
  webhookSignatureKey?: string;
};

class SquareConfigValidator {
  @IsString()
  @IsOptional()
  SQUARE_OAUTH_CLIENT_ID!: string;

  @IsString()
  @IsOptional()
  SQUARE_OAUTH_CLIENT_SECRET!: string;

  @IsString()
  @IsOptional()
  SQUARE_CLIENT_ENVIRONMENT!: string;

  @IsString()
  @IsOptional()
  SQUARE_BASE_URL!: string;

  @IsString()
  @IsOptional()
  SQUARE_WEBHOOK_SIGNATURE_KEY?: string;
}

export const SquareConfig = registerAs<SquareConfigType>('square', () => {
  const errors = validateSync(
    plainToClass(SquareConfigValidator, process.env, {
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
    clientEnvironment: process.env.SQUARE_CLIENT_ENVIRONMENT!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    oauthClientId: process.env.SQUARE_OAUTH_CLIENT_ID!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    oauthClientSecret: process.env.SQUARE_OAUTH_CLIENT_SECRET!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    baseUrl: process.env.SQUARE_BASE_URL!,
    webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
  };
});
