import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Validate,
} from 'class-validator';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer.js';
import { IsNotExist } from '../../utils/validators/is-not-exists.validator.js';

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(lowerCaseTransformer)
  @Validate(IsNotExist, ['User'], {
    message: 'emailAlreadyExists',
  })
  @IsEmail()
  @Length(3, 512)
  email: string;

  @ApiProperty({ example: '123456' })
  @Length(6, 512)
  password: string;

  @ApiProperty({ example: 'John', nullable: true, required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe', nullable: true, required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  // @ApiProperty({
  //   enum: Object.values(RoleNameEnum),
  // })
  // @IsNotEmpty()
  // @IsIn([RoleNameEnum.user])
  // role: RoleNameEnum;
}
