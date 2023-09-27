import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StripeCheckoutDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  checkoutSessionId?: string;
}
