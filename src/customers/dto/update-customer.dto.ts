import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CustomerCreateDto } from './create-customer.dto.js';

export class CustomerUpdateDto extends PartialType(CustomerCreateDto) {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  preferredLocationId?: string;
}
