import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SquareConfirmOauthDto {
  @ApiProperty({ example: 'moa_square_test_code' })
  @IsNotEmpty()
  @IsString()
  oauthAccessCode!: string;
}
