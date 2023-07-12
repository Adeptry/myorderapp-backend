import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfigUpdateInput {
  @ApiProperty()
  @IsString()
  @IsOptional()
  seedColor?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fontFamily?: string;
}
