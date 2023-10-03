import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { lowerCaseTransformer } from '../../utils/lower-case.transformer.js';

export class AuthenticationEmailLoginRequestBody {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(lowerCaseTransformer)
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  password!: string;
}
