import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class StatisticsOutput {
  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  sum?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  average?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  minimum?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  maximum?: number;
}
