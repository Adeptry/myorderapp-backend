import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from '../../../utils/types/infinity-pagination-result.type.js';
import { Customer } from '../../entities/customers/customer.entity.js';

export class CustomersPaginatedResponse extends InfinityPaginationResultType<Customer> {
  @ApiProperty({
    type: () => Customer,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: Customer[];
}
