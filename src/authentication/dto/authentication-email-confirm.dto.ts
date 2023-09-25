import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthenticationEmailConfirmRequestBody {
  @ApiProperty()
  @IsNotEmpty()
  hash!: string;
}
