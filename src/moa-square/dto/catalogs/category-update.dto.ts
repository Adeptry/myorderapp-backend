import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CategoryUpdateDto {
  @ApiProperty({ nullable: true, required: false })
  @IsNumber()
  @IsOptional()
  moaOrdinal?: number;

  @ApiProperty({ nullable: true, required: false })
  @IsBoolean()
  @IsOptional()
  moaEnabled?: boolean;
}

export class CategoryUpdateAllDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ nullable: true, required: false })
  @IsNumber()
  @IsOptional()
  moaOrdinal?: number;

  @ApiProperty({ nullable: true, required: false })
  @IsBoolean()
  @IsOptional()
  moaEnabled?: boolean;
}
