import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsRFC3339, IsString } from 'class-validator';
import { nanoid } from 'nanoid';
import { FulfillmentRecipientInput } from './payment-create-recipient.dto.js';

export class OrdersPostPaymentBody {
  @ApiProperty({
    example: new Date().toISOString(),
    description:
      'If not provided, prepare ASAP, else will validate it\'s within business hours and schedule. Represents the start of the pickup window. Must be in RFC 3339 timestamp format, e.g., "2016-09-04T23:59:33.123Z".',
  })
  @IsOptional()
  @IsRFC3339()
  pickupDate?: string;

  @ApiProperty()
  @IsString()
  paymentSquareId!: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  note?: string | null;

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

  @ApiProperty({
    required: false,
    type: FulfillmentRecipientInput,
    nullable: true,
  })
  @IsOptional()
  recipient?: FulfillmentRecipientInput;
}
