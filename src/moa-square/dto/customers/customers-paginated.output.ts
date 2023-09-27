import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from '../../../utils/types/infinity-pagination-result.type.js';
import { CustomerEntity } from '../../entities/customers/customer.entity.js';

export class CustomersPaginatedResponse extends InfinityPaginationResultType<CustomerEntity> {
  @ApiProperty({
    type: () => CustomerEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: CustomerEntity[];
}
