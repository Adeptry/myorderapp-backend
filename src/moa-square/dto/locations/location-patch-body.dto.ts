import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class LocationPatchBody {
  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false, nullable: true })
  moaOrdinal?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, nullable: true })
  moaEnabled?: boolean;
}
