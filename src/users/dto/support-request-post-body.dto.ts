import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SupportRequestPostBody {
  @ApiProperty({ required: false, nullable: true })
  @IsNotEmpty()
  @IsString()
  subject?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsNotEmpty()
  @IsString()
  text?: string;
}
