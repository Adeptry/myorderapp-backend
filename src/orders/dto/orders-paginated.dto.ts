import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';
import { Order } from '../entities/order.entity';

export class OrdersPaginatedReponse extends InfinityPaginationResultType<Order> {
  @ApiProperty({ type: () => Order, isArray: true, required: false })
  data: Order[];
}
