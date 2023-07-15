import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class ItemUpdateDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty()
  moaOrdinal?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  moaEnabled?: boolean;
}

export class ItemUpdateAllDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  id!: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  moaOrdinal?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  moaEnabled?: boolean;
}
