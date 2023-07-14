import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { VariationAddDto } from './variation-add.dto';

export class OrderPostDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ required: false, type: VariationAddDto, isArray: true })
  @IsArray({})
  variations?: VariationAddDto[];
}
