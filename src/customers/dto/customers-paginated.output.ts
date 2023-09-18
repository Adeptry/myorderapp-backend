import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../../customers/entities/customer.entity.js';
import { InfinityPaginationResultType } from '../../utils/types/infinity-pagination-result.type.js';

export class CustomersPaginatedResponse extends InfinityPaginationResultType<Customer> {
  @ApiProperty({
    type: () => Customer,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: Customer[];
}
