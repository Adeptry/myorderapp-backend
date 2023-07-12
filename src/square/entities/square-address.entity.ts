import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class SquareAddress {
  @ApiProperty({ nullable: true })
  @IsOptional()
  addressLine1?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  addressLine3?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  locality?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  sublocality?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  sublocality2?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  sublocality3?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  administrativeDistrictLevel1?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  administrativeDistrictLevel2?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  administrativeDistrictLevel3?: string;

  @ApiProperty({ nullable: true, example: '94103' })
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  country?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  firstName?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  lastName?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  organization?: string;
}
