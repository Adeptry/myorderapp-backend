import { ApiProperty } from '@nestjs/swagger';
import { MoaCategory } from 'src/catalogs/entities/category.entity';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';

export class MoaCategoryPaginatedResponse extends InfinityPaginationResultType<MoaCategory> {
  @ApiProperty({ type: () => MoaCategory, isArray: true, required: false })
  data: MoaCategory[];
}
