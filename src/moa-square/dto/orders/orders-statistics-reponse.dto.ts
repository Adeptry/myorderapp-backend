import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { StatisticsOutput } from './statistics-output.dto.js';

export class OrdersStatisticsResponse {
  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  count?: number;

  @ApiProperty({
    required: false,
    type: () => StatisticsOutput,
    nullable: true,
  })
  moneyAmount?: StatisticsOutput;

  @ApiProperty({
    required: false,
    type: () => StatisticsOutput,
    nullable: true,
  })
  taxMoneyAmount?: StatisticsOutput;

  @ApiProperty({
    required: false,
    type: () => StatisticsOutput,
    nullable: true,
  })
  tipMoneyAmount?: StatisticsOutput;

  @ApiProperty({
    required: false,
    type: () => StatisticsOutput,
    nullable: true,
  })
  serviceChargeMoneyAmount?: StatisticsOutput;

  @ApiProperty({
    required: false,
    type: () => StatisticsOutput,
    nullable: true,
  })
  appFeeMoneyAmount?: StatisticsOutput;
}
