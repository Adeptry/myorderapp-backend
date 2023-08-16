import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsHexColor,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { ThemeModeEnum } from '../entities/theme-mode.enum';

export class AppConfigUpdateDto {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  @Length(3, 30)
  name?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  @IsHexColor()
  seedColor?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  fontFamily?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  @Length(3, 30)
  shortDescription?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  @Length(3, 4000)
  fullDescription?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  keywords?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @IsBoolean()
  @IsOptional()
  useMaterial3?: boolean;

  @ApiProperty({
    enum: Object.values(ThemeModeEnum),
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  themeMode?: ThemeModeEnum;
}
