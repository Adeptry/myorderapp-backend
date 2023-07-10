import { ApiProperty } from '@nestjs/swagger';
import { MoaItem } from 'src/catalogs/entities/item.entity';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';

export class MoaItemPaginatedResponse extends InfinityPaginationResultType<MoaItem> {
  @ApiProperty({ type: () => MoaItem, isArray: true, required: false })
  data: MoaItem[];
}
