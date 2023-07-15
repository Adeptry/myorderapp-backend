import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CategoryUpdateDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  moaOrdinal?: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  moaEnabled?: boolean;
}

export class CategoryUpdateAllDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  moaOrdinal?: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  moaEnabled?: boolean;
}
