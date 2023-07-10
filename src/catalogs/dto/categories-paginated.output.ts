import { ApiProperty } from '@nestjs/swagger';
import { Category } from 'src/catalogs/entities/category.entity';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';

export class MoaCategoryPaginatedResponse extends InfinityPaginationResultType<Category> {
  @ApiProperty({ type: () => Category, isArray: true, required: false })
  data: Category[];
}
