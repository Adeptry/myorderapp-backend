import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StripeConfirmCheckoutSessionIdDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  checkoutSessionId: string;
}
