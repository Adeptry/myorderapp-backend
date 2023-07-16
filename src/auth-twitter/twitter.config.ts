import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from 'src/utils/validate-config';

export type TwitterConfig = {
  consumerKey?: string;
  consumerSecret?: string;
};

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  TWITTER_CONSUMER_KEY: string;

  @IsString()
  @IsOptional()
  TWITTER_CONSUMER_SECRET: string;
}

export default registerAs('twitter', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  };
});
