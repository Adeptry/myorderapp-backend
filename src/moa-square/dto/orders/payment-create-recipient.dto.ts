import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FulfillmentRecipientInput {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  firstName?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  lastName?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  phoneNumber?: string; // | null;
}
