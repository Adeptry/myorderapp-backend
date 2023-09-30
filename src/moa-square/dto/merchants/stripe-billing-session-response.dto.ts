import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StripeBillingSessionResponse {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  url!: string;
}
