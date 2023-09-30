import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StripePostCheckoutResponse {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  checkoutSessionId?: string;
}
