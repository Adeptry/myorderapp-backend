import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class StripeCheckoutCreateDto {
  @ApiProperty({ example: 'http://localhost:3000/stripe/checkout/success' })
  @IsNotEmpty()
  successUrl: string;

  @ApiProperty({ example: 'http://localhost:3000/stripe/checkout/cancel' })
  @IsOptional()
  cancelUrl: string;

  @ApiProperty({ example: 'price_1NXr6OIO3O3Eil4YtVWoZfGP' })
  @IsNotEmpty()
  stripePriceId: string;
}
