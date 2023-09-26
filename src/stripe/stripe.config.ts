import { registerAs } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { IsOptional, IsString, validateSync } from 'class-validator';

export type StripeConfigType = {
  apiKey: string;
  webhookSecret?: string;
};

class StripeConfigValidator {
  @IsString()
  STRIPE_API_KEY!: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;
}

export const StripeConfig = registerAs<StripeConfigType>('stripe', () => {
  const errors = validateSync(
    plainToClass(StripeConfigValidator, process.env, {
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
    apiKey: process.env.STRIPE_API_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  };
});
