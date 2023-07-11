import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CategoryUpdateInput {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  moaOrdinal?: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  moaEnabled?: boolean;
}

export class CategoryUpdateAllInput {
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
