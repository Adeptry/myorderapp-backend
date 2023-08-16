import { ApiProperty } from '@nestjs/swagger';
import { Customer } from 'src/customers/entities/customer.entity';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';

export class CustomersPaginatedResponse extends InfinityPaginationResultType<Customer> {
  @ApiProperty({
    type: () => Customer,
    isArray: true,
    required: false,
    nullable: true,
  })
  data: Customer[];
}
