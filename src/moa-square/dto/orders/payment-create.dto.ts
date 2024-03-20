/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsRFC3339, IsString } from 'class-validator';
import { nanoid } from 'nanoid';
import { FulfillmentRecipientInput } from './payment-create-recipient.dto.js';

export class OrdersPostPaymentBody {
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'If not provided, prepare ASAP, else will validate it\'s within business hours and schedule. Represents the start of the pickup window. Must be in RFC 3339 timestamp format, e.g., "2016-09-04T23:59:33.123Z".',
  })
  @IsOptional()
  @IsRFC3339()
  pickupDateString?: string;

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
  tipMoneyAmount!: number;

  @ApiProperty({
    required: false,
    type: FulfillmentRecipientInput,
    nullable: true,
  })
  @IsOptional()
  recipient?: FulfillmentRecipientInput;

  @ApiProperty({
    required: false,
    type: Boolean,
    nullable: true,
  })
  @IsOptional()
  platformIsAndroid?: boolean;

  @ApiProperty({
    required: false,
    type: Boolean,
    nullable: true,
  })
  @IsOptional()
  platformIsIos?: boolean;

  @ApiProperty({
    required: false,
    type: Boolean,
    nullable: true,
  })
  @IsOptional()
  platformIsWeb?: boolean;
}
