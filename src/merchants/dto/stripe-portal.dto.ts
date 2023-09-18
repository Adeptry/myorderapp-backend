import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StripeBillingPortalCreateOutput {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  url!: string;
}

export class StripeBillingPortalCreateInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  returnUrl!: string;
}
