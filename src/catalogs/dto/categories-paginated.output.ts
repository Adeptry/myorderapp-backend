import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../catalogs/entities/category.entity.js';
import { InfinityPaginationResultType } from '../../utils/types/infinity-pagination-result.type.js';

export class CategoryPaginatedResponse extends InfinityPaginationResultType<Category> {
  @ApiProperty({
    type: () => Category,
    isArray: true,
    required: false,
    nullable: true,
  })
  data: Category[];
}
