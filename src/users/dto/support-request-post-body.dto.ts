import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SupportRequestPostBody {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  subject?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  text?: string;
}
