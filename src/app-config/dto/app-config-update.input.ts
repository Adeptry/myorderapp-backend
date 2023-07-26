import { ApiProperty } from '@nestjs/swagger';
import {
  IsHexColor,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class ConfigUpdateDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Length(3, 30)
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsHexColor()
  seedColor?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fontFamily?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Length(3, 30)
  shortDescription?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Length(3, 4000)
  fullDescription?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  keywords?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  url?: string;
}
