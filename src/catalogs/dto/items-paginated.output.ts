import { ApiProperty } from '@nestjs/swagger';
import { Item } from 'src/catalogs/entities/item.entity';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';

export class ItemPaginatedResponse extends InfinityPaginationResultType<Item> {
  @ApiProperty({ type: () => Item, isArray: true, required: false })
  data: Item[];
}
