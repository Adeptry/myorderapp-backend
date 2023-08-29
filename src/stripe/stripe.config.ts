import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from 'src/utils/validate-config';

export type StripeConfig = {
  apiKey: string;
  priceUSD: string;
  priceEUR: string;
  priceGBP: string;
  priceJPY: string;
  priceCAD: string;
  priceAUD: string;
};

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  STRIPE_API_KEY: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_USD: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_EUR: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_GBP: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_JPY: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_CAD: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_AUD: string;
}

export default registerAs('stripe', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    apiKey: process.env.STRIPE_API_KEY,
    priceIdUSD: process.env.STRIPE_PRICE_ID_USD,
    priceIdEUR: process.env.STRIPE_PRICE_ID_EUR,
    priceIdGBP: process.env.STRIPE_PRICE_ID_GBP,
    priceIdJPY: process.env.STRIPE_PRICE_ID_JPY,
    priceIdCAD: process.env.STRIPE_PRICE_ID_CAD,
    priceIdAUD: process.env.STRIPE_PRICE_ID_AUD,
  };
});
