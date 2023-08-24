import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { VariationAddDto } from './variation-add.dto';

export class OrderPostDto {
  @ApiProperty({
    required: false,
    type: VariationAddDto,
    isArray: true,
    nullable: true,
  })
  @IsArray({})
  variations?: VariationAddDto[];
}

export class OrderCreateDto {
  @ApiProperty({
    required: false,
    type: VariationAddDto,
    isArray: true,
    nullable: true,
  })
  @IsArray({})
  @IsOptional()
  variations?: VariationAddDto[];

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
