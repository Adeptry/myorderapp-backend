import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthenticationPasswordResetRequestBody {
  @ApiProperty()
  @IsNotEmpty()
  password!: string;

  @ApiProperty()
  @IsNotEmpty()
  hash!: string;
}
