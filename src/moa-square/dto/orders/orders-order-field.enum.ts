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
import { SortItem } from '../../../database/sort-item.dto.js';
import { SortItemsInput } from '../../../database/sort-items-input.dto.js';
import { SortOrderEnum } from '../../../database/sort-order.enum.js';

export enum OrdersOrderFieldEnum {
  id = 'id',
  squareId = 'squareId',
  pickupDate = 'pickupDate',
  closedDate = 'closedDate',
  customerId = 'customerId',
  locationId = 'locationId',
  totalMoneyAmount = 'totalMoneyAmount',
  totalTaxMoneyAmount = 'totalTaxMoneyAmount',
  totalDiscountMoneyAmount = 'totalDiscountMoneyAmount',
  totalTipMoneyAmount = 'totalTipMoneyAmount',
  totalServiceChargeMoneyAmount = 'totalServiceChargeMoneyAmount',
  appFeeMoneyAmount = 'appFeeMoneyAmount',
}

export class OrdersSortItem implements SortItem<OrdersOrderFieldEnum> {
  @ApiProperty({
    required: true,
    nullable: false,
    enum: Object.values(OrdersOrderFieldEnum),
    enumName: 'OrdersOrderFieldEnum',
  })
  field!: OrdersOrderFieldEnum;

  @ApiProperty({
    required: true,
    nullable: false,
    enum: Object.values(SortOrderEnum),
    enumName: 'SortOrderEnum',
  })
  sort!: SortOrderEnum;
}

export class OrdersSortItemsInput
  implements SortItemsInput<OrdersOrderFieldEnum>
{
  @ApiProperty({
    type: () => OrdersSortItem,
    isArray: true,
    required: false,
    nullable: true,
  })
  items!: OrdersSortItem[];
}
