import { ApiProperty } from '@nestjs/swagger';
import { StatisticsOutput } from './statistics-output.dto.js';

export class OrdersStatisticsResponse {
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
  moneyTaxAmount?: StatisticsOutput;

  @ApiProperty({
    required: false,
    type: () => StatisticsOutput,
    nullable: true,
  })
  moneyTipAmount?: StatisticsOutput;

  @ApiProperty({
    required: false,
    type: () => StatisticsOutput,
    nullable: true,
  })
  moneyServiceChargeAmount?: StatisticsOutput;

  @ApiProperty({
    required: false,
    type: () => StatisticsOutput,
    nullable: true,
  })
  moneyAppFeeAmount?: StatisticsOutput;
}
