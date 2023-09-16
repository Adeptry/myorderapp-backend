import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../../orders/entities/order.entity.js';
import { InfinityPaginationResultType } from '../../utils/types/infinity-pagination-result.type.js';

export class OrdersPaginatedReponse extends InfinityPaginationResultType<Order> {
  @ApiProperty({
    type: () => Order,
    isArray: true,
    required: false,
    nullable: true,
  })
  data: Order[];
}
