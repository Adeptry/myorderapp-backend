import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { lowerCaseTransformer } from '../../utils/lower-case.transformer.js';

export class AuthenticationPasswordForgotRequestBody {
  @ApiProperty()
  @Transform(lowerCaseTransformer)
  @IsEmail()
  email!: string;
}
