import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, Validate } from 'class-validator';
import { IsNotExist } from '../../utils/is-not-exists.validator.js';
import { lowerCaseTransformer } from '../../utils/lower-case.transformer.js';

export class UserPatchBody {
  @ApiProperty({
    type: String,
    example: 'test1@example.com',
    required: false,
    nullable: true,
  })
  @Transform(lowerCaseTransformer)
  @IsOptional()
  @Validate(IsNotExist, ['User'], {
    message: 'emailAlreadyExists',
  })
  @IsEmail()
  email?: string | null;

  @ApiProperty({
    type: String,
    example: 'John',
    required: false,
    nullable: true,
  })
  @IsOptional()
  firstName?: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
    required: false,
    nullable: true,
  })
  @IsOptional()
  lastName?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  @IsOptional()
  phoneNumber?: string | null;

  @ApiProperty({
    type: String,
    example: 'en',
    required: false,
    nullable: true,
  })
  @IsOptional()
  language?: string | null;
}
