import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class OrdersVariationLineItemInput {
  @ApiProperty({ required: true })
  @IsString()
  id?: string;

  @ApiProperty({ required: true })
  @IsNumber()
  quantity?: number;

  @ApiProperty({ required: false, type: String, isArray: true, nullable: true })
  @IsArray()
  @IsOptional()
  modifierIds?: string[];

  @ApiProperty({ required: false, type: String, nullable: true })
  @IsArray()
  @IsOptional()
  note?: string;
}
