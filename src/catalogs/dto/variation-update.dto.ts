import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class VariationUpdateDto {
  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: true })
  moaEnabled?: boolean;
}
