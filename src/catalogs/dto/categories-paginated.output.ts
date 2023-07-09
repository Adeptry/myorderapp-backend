import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';
import { MoaCategory } from '../entities/category.entity';

export class MoaCategoryPaginatedResponse extends InfinityPaginationResultType<MoaCategory> {
  @ApiProperty({ type: () => MoaCategory, isArray: true, required: false })
  data: MoaCategory[];

  @ApiProperty({ required: false })
  count?: number;

  @ApiProperty({ required: false })
  pages: number;
}
