import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';
import { Customer } from '../entities/customer.entity';

export class CustomersPaginatedResponse extends InfinityPaginationResultType<Customer> {
  @ApiProperty({ type: () => Customer, isArray: true, required: false })
  data: Customer[];
}
