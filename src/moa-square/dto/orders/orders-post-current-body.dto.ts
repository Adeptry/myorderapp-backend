import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { OrdersVariationLineItemInput } from './variation-add.dto.js';

export class OrderPostCurrentBody {
  @ApiProperty({
    required: false,
    type: OrdersVariationLineItemInput,
    isArray: true,
    nullable: true,
  })
  @IsArray({})
  variations?: OrdersVariationLineItemInput[];
}
