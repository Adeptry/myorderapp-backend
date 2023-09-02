import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, Validate } from 'class-validator';
import { lowerCaseTransformer } from 'src/utils/transformers/lower-case.transformer';
import { IsNotExist } from 'src/utils/validators/is-not-exists.validator';

export class UserUpdateDto {
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
}
