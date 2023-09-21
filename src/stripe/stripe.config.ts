import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from '../utils/validate-config.js';

export type StripeConfig = {
  apiKey: string;
  webhookSecret: string;

  priceIdTier2USD: string;
  priceIdTier2EUR: string;
  priceIdTier2GBP: string;
  priceIdTier2JPY: string;
  priceIdTier2CAD: string;
  priceIdTier2AUD: string;

  priceIdTier1USD: string;
  priceIdTier1EUR: string;
  priceIdTier1GBP: string;
  priceIdTier1JPY: string;
  priceIdTier1CAD: string;
  priceIdTier1AUD: string;

  priceIdTier0USD: string;
  priceIdTier0EUR: string;
  priceIdTier0GBP: string;
  priceIdTier0JPY: string;
  priceIdTier0CAD: string;
  priceIdTier0AUD: string;
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

    priceIdTier2USD: process.env.STRIPE_PRICE_ID_TIER_2_USD,
    priceIdTier2EUR: process.env.STRIPE_PRICE_ID_TIER_2_EUR,
    priceIdTier2GBP: process.env.STRIPE_PRICE_ID_TIER_2_GBP,
    priceIdTier2JPY: process.env.STRIPE_PRICE_ID_TIER_2_JPY,
    priceIdTier2CAD: process.env.STRIPE_PRICE_ID_TIER_2_CAD,
    priceIdTier2AUD: process.env.STRIPE_PRICE_ID_TIER_2_AUD,

    priceIdTier1USD: process.env.STRIPE_PRICE_ID_TIER_1_USD,
    priceIdTier1EUR: process.env.STRIPE_PRICE_ID_TIER_1_EUR,
    priceIdTier1GBP: process.env.STRIPE_PRICE_ID_TIER_1_GBP,
    priceIdTier1JPY: process.env.STRIPE_PRICE_ID_TIER_1_JPY,
    priceIdTier1CAD: process.env.STRIPE_PRICE_ID_TIER_1_CAD,
    priceIdTier1AUD: process.env.STRIPE_PRICE_ID_TIER_1_AUD,

    priceIdTier0USD: process.env.STRIPE_PRICE_ID_TIER_0_USD,
    priceIdTier0EUR: process.env.STRIPE_PRICE_ID_TIER_0_EUR,
    priceIdTier0GBP: process.env.STRIPE_PRICE_ID_TIER_0_GBP,
    priceIdTier0JPY: process.env.STRIPE_PRICE_ID_TIER_0_JPY,
    priceIdTier0CAD: process.env.STRIPE_PRICE_ID_TIER_0_CAD,
    priceIdTier0AUD: process.env.STRIPE_PRICE_ID_TIER_0_AUD,
  };
});
