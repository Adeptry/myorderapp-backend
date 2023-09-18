import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from '../utils/validate-config.js';

export type StripeConfig = {
  apiKey: string;
  webhookSecret: string;

  priceIdProUSD: string;
  priceIdProEUR: string;
  priceIdProGBP: string;
  priceIdProJPY: string;
  priceIdProCAD: string;
  priceIdProAUD: string;

  priceIdFreeUSD: string;
  priceIdFreeEUR: string;
  priceIdFreeGBP: string;
  priceIdFreeJPY: string;
  priceIdFreeCAD: string;
  priceIdFreeAUD: string;
};

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  STRIPE_API_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRO_PRICE_USD?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRO_PRICE_ID_EUR?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRO_PRICE_ID_GBP?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRO_PRICE_ID_JPY?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRO_PRICE_ID_CAD?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRO_PRICE_ID_AUD?: string;
}

export default registerAs('stripe', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    apiKey: process.env.STRIPE_API_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceIdProUSD: process.env.STRIPE_PRICE_ID_PRO_USD,
    priceIdProEUR: process.env.STRIPE_PRICE_ID_PRO_EUR,
    priceIdProGBP: process.env.STRIPE_PRICE_ID_PRO_GBP,
    priceIdProJPY: process.env.STRIPE_PRICE_ID_PRO_JPY,
    priceIdProCAD: process.env.STRIPE_PRICE_ID_PRO_CAD,
    priceIdProAUD: process.env.STRIPE_PRICE_ID_PRO_AUD,

    priceIdFreeUSD: process.env.STRIPE_PRICE_ID_FREE_USD,
    priceIdFreeEUR: process.env.STRIPE_PRICE_ID_FREE_EUR,
    priceIdFreeGBP: process.env.STRIPE_PRICE_ID_FREE_GBP,
    priceIdFreeJPY: process.env.STRIPE_PRICE_ID_FREE_JPY,
    priceIdFreeCAD: process.env.STRIPE_PRICE_ID_FREE_CAD,
    priceIdFreeAUD: process.env.STRIPE_PRICE_ID_FREE_AUD,
  };
});
