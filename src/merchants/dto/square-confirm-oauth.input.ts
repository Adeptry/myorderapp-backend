import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SquareConfirmOauthDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  oauthAccessCode?: string;
}
