import { ApiProperty } from '@nestjs/swagger';
import { PaginationResultType } from '../../../database/pagination-result.type.js';
import { ItemEntity } from '../../entities/item.entity.js';

export class ItemPaginatedResponse extends PaginationResultType<ItemEntity> {
  @ApiProperty({
    type: () => ItemEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: ItemEntity[];
}
