import { ApiProperty } from '@nestjs/swagger';
import { PaginationResultType } from '../../../database/pagination-result.type.js';
import { OrderEntity } from '../../entities/order.entity.js';

export class OrdersPaginatedResponse extends PaginationResultType<OrderEntity> {
  @ApiProperty({
    type: () => OrderEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: OrderEntity[];
}
