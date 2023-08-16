import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class ItemUpdateDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false, nullable: true })
  moaOrdinal?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, nullable: true })
  moaEnabled?: boolean;
}

export class ItemUpdateAllDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  id!: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false, nullable: true })
  moaOrdinal?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, nullable: true })
  moaEnabled?: boolean;
}
