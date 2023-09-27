import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from '../../../utils/types/infinity-pagination-result.type.js';
import { ItemEntity } from '../../entities/catalogs/item.entity.js';

export class ItemPaginatedResponse extends InfinityPaginationResultType<ItemEntity> {
  @ApiProperty({
    type: () => ItemEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: ItemEntity[];
}
