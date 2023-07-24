import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfigUpdateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  seedColor?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fontFamily?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fullDescription?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  keywords?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  url?: string;
}
