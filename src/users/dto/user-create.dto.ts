import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Validate,
} from 'class-validator';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer.js';
import { IsExist } from '../../utils/validators/is-exists.validator.js';
import { IsNotExist } from '../../utils/validators/is-not-exists.validator.js';
import { RoleEntity } from '../entities/role.entity.js';
import { StatusEntity } from '../entities/status.entity.js';

export class UserCreateDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @Validate(IsNotExist, ['User'], {
    message: 'emailAlreadyExists',
  })
  @IsEmail()
  email?: string | null;

  @ApiProperty()
  @MinLength(6)
  password?: string;

  provider?: string;

  socialId?: string | null;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  firstName?: string | null;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  lastName?: string | null;

  @ApiProperty({ example: 'John' })
  // @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string | null;

  // @ApiProperty({ type: () => FileEntity })
  // @IsOptional()
  // @Validate(IsExist, ['FileEntity', 'id'], {
  //   message: 'imageNotExists',
  // })
  // photo?: FileEntity | null;

  @ApiProperty({ type: RoleEntity })
  @Validate(IsExist, ['Role', 'id'], {
    message: 'roleNotExists',
  })
  role?: RoleEntity | null;

  @ApiProperty({ type: StatusEntity })
  @Validate(IsExist, ['Status', 'id'], {
    message: 'statusNotExists',
  })
  status?: StatusEntity;

  hash?: string | null;
}
