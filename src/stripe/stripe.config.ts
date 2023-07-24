import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from 'src/utils/validate-config';

export type StripeConfig = {
  apiKey: string;
  subscriptionPrice: string;
  developerPrice: string;
};

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  STRIPE_API_KEY: string;

  @IsString()
  @IsOptional()
  STRIPE_SUBSCRIPTION_PRICE: string;

  @IsString()
  @IsOptional()
  STRIPE_APPLE_DEVELOPER_PRICE: string;
}

export default registerAs('stripe', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    apiKey: process.env.STRIPE_API_KEY,
    subscriptionPrice: process.env.STRIPE_SUBSCRIPTION_PRICE,
    developerPrice: process.env.STRIPE_APPLE_DEVELOPER_PRICE,
  };
});
