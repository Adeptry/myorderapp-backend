import { ApiProperty } from '@nestjs/swagger';
import { Item } from '../../catalogs/entities/item.entity.js';
import { InfinityPaginationResultType } from '../../utils/types/infinity-pagination-result.type.js';

export class ItemPaginatedResponse extends InfinityPaginationResultType<Item> {
  @ApiProperty({
    type: () => Item,
    isArray: true,
    required: false,
    nullable: true,
  })
  data: Item[];
}
