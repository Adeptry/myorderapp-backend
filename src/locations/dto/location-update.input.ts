import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class LocationUpdateInput {
  @IsNumber()
  @IsOptional()
  @ApiProperty()
  moaOrdinal?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  moaEnabled?: boolean;
}

export class LocationUpdateAllInput {
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
