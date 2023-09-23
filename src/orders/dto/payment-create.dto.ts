import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsRFC3339, IsString } from 'class-validator';
import { nanoid } from 'nanoid';

export class PaymentCreateDto {
  @ApiProperty({
    example: new Date().toISOString(),
    description:
      'If not provided, prepare ASAP, else will validate it\'s within business hours and schedule. Represents the start of the pickup window. Must be in RFC 3339 timestamp format, e.g., "2016-09-04T23:59:33.123Z".',
  })
  @IsOptional()
  @IsRFC3339()
  pickupAt?: string;

  @ApiProperty()
  @IsString()
  paymentSquareId!: string;

  @IsString()
  @ApiProperty({
    example: nanoid(),
    required: true,
    nullable: false,
    description: 'Should be generated on checkout screen presentation.',
  })
  idempotencyKey!: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  orderTipMoney!: number;
}
