import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfigUpdateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  seedColor?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fontFamily?: string;
}
