import { ApiProperty } from '@nestjs/swagger';
import {
  IsHexColor,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { AppearanceEnum } from '../entities/appearance.enum';
import { ColorModeEnum } from '../entities/color-mode.enum';

export class AppConfigUpdateDto {
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

  @ApiProperty({
    enum: Object.values(AppearanceEnum),
    required: false,
  })
  @IsString()
  @IsOptional()
  appearance?: AppearanceEnum;

  @ApiProperty({
    enum: Object.values(ColorModeEnum),
    required: false,
  })
  @IsString()
  @IsOptional()
  colorMode?: ColorModeEnum;
}
