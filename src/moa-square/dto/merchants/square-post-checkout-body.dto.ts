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
import { IsNotEmpty, IsOptional } from 'class-validator';

export class StripePostCheckoutBody {
  @ApiProperty({ example: 'http://localhost:3000/stripe/checkout/success' })
  @IsNotEmpty()
  successUrl!: string;

  @ApiProperty({ example: 'http://localhost:3000/stripe/checkout/cancel' })
  @IsOptional()
  cancelUrl!: string;

  @ApiProperty({ example: 'price_1NXr6OIO3O3Eil4YtVWoZfGP' })
  @IsNotEmpty()
  stripePriceId!: string;
}
