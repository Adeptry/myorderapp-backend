import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CurrencyEnum } from 'src/utils/types/currency-enum.type';

export class StripeCheckoutCreateDto {
  @ApiProperty({ example: 'http://localhost:3000/stripe/checkout/success' })
  @IsNotEmpty()
  successUrl: string;

  @ApiProperty({ example: 'http://localhost:3000/stripe/checkout/cancel' })
  @IsOptional()
  cancelUrl: string;

  @ApiProperty({
    example: 'USD',
    enum: Object.values(CurrencyEnum),
    description:
      'The currency must be one of the following: USD, EUR, GBP, JPY, CAD, AUD',
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(CurrencyEnum))
  currency: CurrencyEnum;
}
