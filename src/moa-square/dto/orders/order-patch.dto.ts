import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class OrderPatchDto {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  locationId?: string;
}
