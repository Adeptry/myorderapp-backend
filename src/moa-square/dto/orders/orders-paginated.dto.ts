import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from '../../../utils/types/infinity-pagination-result.type.js';
import { OrderEntity } from '../../entities/orders/order.entity.js';

export class OrdersPaginatedReponse extends InfinityPaginationResultType<OrderEntity> {
  @ApiProperty({
    type: () => OrderEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: OrderEntity[];
}
