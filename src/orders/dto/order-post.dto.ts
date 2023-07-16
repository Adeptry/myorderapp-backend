import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { VariationAddDto } from './variation-add.dto';

export class OrderPostDto {
  @ApiProperty({ required: false, type: VariationAddDto, isArray: true })
  @IsArray({})
  variations?: VariationAddDto[];
}

export class OrderCreateDto {
  @ApiProperty({ required: false, type: VariationAddDto, isArray: true })
  @IsArray({})
  variations?: VariationAddDto[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
