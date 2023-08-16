import { ApiProperty } from '@nestjs/swagger';
import { Category } from 'src/catalogs/entities/category.entity';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';

export class CategoryPaginatedResponse extends InfinityPaginationResultType<Category> {
  @ApiProperty({
    type: () => Category,
    isArray: true,
    required: false,
    nullable: true,
  })
  data: Category[];
}
