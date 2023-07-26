import { ApiProperty } from '@nestjs/swagger';
import {
  IsHexColor,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class ConfigUpdateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @Length(3, 30)
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsHexColor()
  seedColor?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fontFamily?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Length(3, 30)
  shortDescription?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Length(3, 4000)
  fullDescription?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Length(0, 100)
  keywords?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsUrl()
  url?: string;
}
