import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsHexColor,
  IsOptional,
  IsString,
  Length,
  Matches,
  Validate,
} from 'class-validator';
import { IsNotExist } from '../../utils/validators/is-not-exists.validator.js';
import { ThemeModeEnum } from '../entities/theme-mode.enum.js';

export class AppConfigUpdateDto {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9\s]*$/, {
    message: 'Name should contain only alphanumeric characters and spaces',
  })
  @Validate(IsNotExist, ['AppConfig'], {
    message: 'nameAlreadyExists',
  })
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
    enum: Object.values(ThemeModeEnum),
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  themeMode?: ThemeModeEnum;
}
