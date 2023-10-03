import { ApiProperty } from '@nestjs/swagger';
import { PaginationResultType } from '../../../database/pagination-result.type.js';
import { CategoryEntity } from '../../entities/category.entity.js';

export class CategoryPaginatedResponse extends PaginationResultType<CategoryEntity> {
  @ApiProperty({
    type: () => CategoryEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: CategoryEntity[];
}
