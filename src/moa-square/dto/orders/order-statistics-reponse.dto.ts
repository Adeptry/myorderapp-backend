import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class OrdersStatisticsResponse {
  @ApiProperty({ required: true })
  @IsNumber()
  moneyAmountSum?: number;

  @ApiProperty({ required: true })
  @IsNumber()
  moneyTaxAmountSum?: number;

  @ApiProperty({ required: true })
  @IsNumber()
  moneyTipAmountSum?: number;

  @ApiProperty({ required: true })
  @IsNumber()
  moneyServiceChargeAmountSum?: number;

  @ApiProperty({ required: true })
  @IsNumber()
  moneyAppFeeAmountSum?: number;
}
