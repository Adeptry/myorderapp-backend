import { ApiProperty } from '@nestjs/swagger';
import { PaginationResultType } from '../../../database/pagination-result.type.js';
import { CustomerEntity } from '../../entities/customer.entity.js';

export class CustomersPaginatedResponse extends PaginationResultType<CustomerEntity> {
  @ApiProperty({
    type: () => CustomerEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: CustomerEntity[];
}
