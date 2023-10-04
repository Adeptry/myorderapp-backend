import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsHexColor,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ThemeModeEnum } from '../entities/theme-mode.enum.js';

export class AppConfigUpdateBody {
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

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @IsBoolean()
  @IsOptional()
  useMaterial3?: boolean;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({
    required: false,
    nullable: true,
    enum: Object.values(ThemeModeEnum),
    enumName: 'ThemeModeEnum',
  })
  @IsString()
  @IsOptional()
  themeMode?: ThemeModeEnum;
}
