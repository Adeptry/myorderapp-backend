import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from '../../../utils/types/infinity-pagination-result.type.js';
import { CategoryEntity } from '../../entities/catalogs/category.entity.js';

export class CategoryPaginatedResponse extends InfinityPaginationResultType<CategoryEntity> {
  @ApiProperty({
    type: () => CategoryEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: CategoryEntity[];
}
