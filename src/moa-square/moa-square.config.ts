import { registerAs } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { IsOptional, IsString, validateSync } from 'class-validator';
import { toBigIntOrThrow } from '../utils/to-big-int-or-throw.js';

export type MyOrderAppSquareConfigType = {
  squareClientEnvironment: string;
  squareOauthClientId: string;
  squareOauthClientSecret: string;
  squareWebhookSignatureKey: string;

  squareAppFeeBigIntDenominator: bigint;
  squareTier0AppFeeBigIntNumerator: bigint;
  squareTier1AppFeeBigIntNumerator: bigint;
  squareTier2AppFeeBigIntNumerator: bigint;

  squareTestCode?: string;
  squareTestAccessToken?: string;
  squareTestRefreshToken?: string;
  squareTestExpireAt?: string;
  squareTestId?: string;

  stripeWebhookSecret?: string;

  stripePriceIdTier2USD: string;
  stripePriceIdTier2EUR: string;
  stripePriceIdTier2GBP: string;
  stripePriceIdTier2JPY: string;
  stripePriceIdTier2CAD: string;
  stripePriceIdTier2AUD: string;

  stripePriceIdTier1USD: string;
  stripePriceIdTier1EUR: string;
  stripePriceIdTier1GBP: string;
  stripePriceIdTier1JPY: string;
  stripePriceIdTier1CAD: string;
  stripePriceIdTier1AUD: string;

  stripePriceIdTier0USD: string;
  stripePriceIdTier0EUR: string;
  stripePriceIdTier0GBP: string;
  stripePriceIdTier0JPY: string;
  stripePriceIdTier0CAD: string;
  stripePriceIdTier0AUD: string;
};

class MyOrderAppSquareConfigValidator {
  @IsString()
  SQUARE_OAUTH_CLIENT_ID!: string;

  @IsString()
  SQUARE_OAUTH_CLIENT_SECRET!: string;

  @IsString()
  SQUARE_CLIENT_ENVIRONMENT!: string;

  @IsString()
  SQUARE_WEBHOOK_SIGNATURE_KEY!: string;

  SQUARE_TIER_APP_FEE_BIG_INT_DENOMINATOR!: number;

  SQUARE_TIER_0_APP_FEE_BIG_INT_NUMERATOR!: number;

  SQUARE_TIER_1_APP_FEE_BIG_INT_NUMERATOR!: number;

  SQUARE_TIER_2_APP_FEE_BIG_INT_NUMERATOR!: number;

  @IsString()
  @IsOptional()
  SQUARE_TEST_CODE?: string;

  @IsString()
  @IsOptional()
  SQUARE_TEST_ACCESS_TOKEN?: string;

  @IsString()
  @IsOptional()
  SQUARE_TEST_REFRESH_TOKEN?: string;

  @IsString()
  @IsOptional()
  SQUARE_TEST_EXPIRE_AT?: string;

  @IsString()
  @IsOptional()
  SQUARE_TEST_ID?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_0_USD?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_0_EUR?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_0_GBP?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_0_JPY?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_0_CAD?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_0_AUD?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_1_USD?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_1_EUR?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_1_GBP?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_1_JPY?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_1_CAD?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_1_AUD?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_2_USD?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_2_EUR?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_2_GBP?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_2_JPY?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_2_CAD?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_TIER_2_AUD?: string;
}

export const MyOrderAppSquareConfig = registerAs('moaSquare', () => {
  const errors = validateSync(
    plainToClass(MyOrderAppSquareConfigValidator, process.env, {
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
    squareClientEnvironment: process.env.SQUARE_CLIENT_ENVIRONMENT!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    squareOauthClientId: process.env.SQUARE_OAUTH_CLIENT_ID!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    squareOauthClientSecret: process.env.SQUARE_OAUTH_CLIENT_SECRET!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    squareWebhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!,

    squareAppFeeBigIntDenominator: toBigIntOrThrow(
      process.env.SQUARE_TIER_APP_FEE_BIG_INT_DENOMINATOR!,
    ),
    squareTier0AppFeeBigIntNumerator: toBigIntOrThrow(
      process.env.SQUARE_TIER_0_APP_FEE_BIG_INT_NUMERATOR!,
    ),
    squareTier1AppFeeBigIntNumerator: toBigIntOrThrow(
      process.env.SQUARE_TIER_1_APP_FEE_BIG_INT_NUMERATOR!,
    ),
    squareTier2AppFeeBigIntNumerator: toBigIntOrThrow(
      process.env.SQUARE_TIER_2_APP_FEE_BIG_INT_NUMERATOR!,
    ),

    squareTestCode: process.env.SQUARE_TEST_CODE,
    squareTestAccessToken: process.env.SQUARE_TEST_ACCESS_TOKEN,
    squareTestRefreshToken: process.env.SQUARE_TEST_REFRESH_TOKEN,
    squareTestExpireAt: process.env.SQUARE_TEST_EXPIRE_AT,
    squareTestId: process.env.SQUARE_TEST_ID,

    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

    stripePriceIdTier0USD: process.env.STRIPE_PRICE_ID_TIER_0_USD,
    stripePriceIdTier0EUR: process.env.STRIPE_PRICE_ID_TIER_0_EUR,
    stripePriceIdTier0GBP: process.env.STRIPE_PRICE_ID_TIER_0_GBP,
    stripePriceIdTier0JPY: process.env.STRIPE_PRICE_ID_TIER_0_JPY,
    stripePriceIdTier0CAD: process.env.STRIPE_PRICE_ID_TIER_0_CAD,
    stripePriceIdTier0AUD: process.env.STRIPE_PRICE_ID_TIER_0_AUD,

    stripePriceIdTier1USD: process.env.STRIPE_PRICE_ID_TIER_1_USD,
    stripePriceIdTier1EUR: process.env.STRIPE_PRICE_ID_TIER_1_EUR,
    stripePriceIdTier1GBP: process.env.STRIPE_PRICE_ID_TIER_1_GBP,
    stripePriceIdTier1JPY: process.env.STRIPE_PRICE_ID_TIER_1_JPY,
    stripePriceIdTier1CAD: process.env.STRIPE_PRICE_ID_TIER_1_CAD,
    stripePriceIdTier1AUD: process.env.STRIPE_PRICE_ID_TIER_1_AUD,

    stripePriceIdTier2USD: process.env.STRIPE_PRICE_ID_TIER_2_USD,
    stripePriceIdTier2EUR: process.env.STRIPE_PRICE_ID_TIER_2_EUR,
    stripePriceIdTier2GBP: process.env.STRIPE_PRICE_ID_TIER_2_GBP,
    stripePriceIdTier2JPY: process.env.STRIPE_PRICE_ID_TIER_2_JPY,
    stripePriceIdTier2CAD: process.env.STRIPE_PRICE_ID_TIER_2_CAD,
    stripePriceIdTier2AUD: process.env.STRIPE_PRICE_ID_TIER_2_AUD,
  };
});
