import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class StatisticsOutput {
  @ApiProperty({ required: true })
  @IsNumber()
  sum?: number;

  @ApiProperty({ required: true })
  @IsNumber()
  average?: number;

  @ApiProperty({ required: true })
  @IsNumber()
  minimum?: number;

  @ApiProperty({ required: true })
  @IsNumber()
  maximum?: number;
}
