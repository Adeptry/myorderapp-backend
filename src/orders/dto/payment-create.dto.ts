import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentCreateDto {
  @ApiProperty()
  @IsString()
  paymentSquareId: string;

  @IsString()
  @ApiProperty()
  idempotencyKey: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  orderTipMoney?: number;
}
