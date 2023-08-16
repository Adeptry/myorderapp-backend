import { ApiProperty } from '@nestjs/swagger';
import { Order } from 'src/orders/entities/order.entity';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';

export class OrdersPaginatedReponse extends InfinityPaginationResultType<Order> {
  @ApiProperty({
    type: () => Order,
    isArray: true,
    required: false,
    nullable: true,
  })
  data: Order[];
}
