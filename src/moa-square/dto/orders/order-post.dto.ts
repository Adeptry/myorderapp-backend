import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
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

export class OrderPostBody {
  @ApiProperty({
    required: false,
    type: OrdersVariationLineItemInput,
    isArray: true,
    nullable: true,
  })
  @IsArray({})
  @IsOptional()
  variations?: OrdersVariationLineItemInput[];

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
