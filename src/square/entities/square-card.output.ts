import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { SquareAddress } from './square-address.entity';

export class SquareCard {
  @ApiProperty({ nullable: true })
  @IsOptional()
  id?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  cardBrand?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  last4?: string;

  @ApiProperty({ type: String, required: false, example: '0' })
  @Transform(({ value }) => value && BigInt(value), { toClassOnly: true })
  expMonth?: bigint;

  @ApiProperty({ type: String, required: false, example: '0' })
  @Transform(({ value }) => value && BigInt(value), { toClassOnly: true })
  expYear?: bigint;

  @ApiProperty({ nullable: true })
  @IsOptional()
  cardholderName?: string;

  @ApiProperty({ type: () => SquareAddress, nullable: true })
  billingAddress?: SquareAddress;

  customerId?: string;

  merchantId?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ nullable: true })
  @IsOptional()
  cardType?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  prepaidType?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  bin?: string;

  @ApiProperty({ type: String, required: false })
  @Transform(({ value }) => value && BigInt(value), { toClassOnly: true })
  version?: bigint;

  @ApiProperty({ nullable: true })
  @IsOptional()
  cardCoBrand?: string;
}
