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
  totalMoneyTaxAmount = 'totalMoneyTaxAmount',
  totalMoneyDiscountAmount = 'totalMoneyDiscountAmount',
  totalMoneyTipAmount = 'totalMoneyTipAmount',
  totalMoneyServiceChargeAmount = 'totalMoneyServiceChargeAmount',
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
