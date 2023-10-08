import { registerAs } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { IsString, validateSync } from 'class-validator';

export type TwilioConfigType = {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
};

class TwilioConfigValidator {
  @IsString()
  TWILIO_ACCOUNT_SID!: string;

  @IsString()
  TWILIO_AUTH_TOKEN!: string;

  @IsString()
  TWILIO_PHONE_NUMBER!: string;
}

export const TwilioConfig = registerAs<TwilioConfigType>('twilio', () => {
  const errors = validateSync(
    plainToClass(TwilioConfigValidator, process.env, {
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
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
  };
});
