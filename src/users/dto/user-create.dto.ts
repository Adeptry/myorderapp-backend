import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, MinLength, Validate } from 'class-validator';
import { Role } from '../../roles/entities/role.entity.js';
import { Status } from '../../statuses/entities/status.entity.js';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer.js';
import { IsExist } from '../../utils/validators/is-exists.validator.js';
import { IsNotExist } from '../../utils/validators/is-not-exists.validator.js';

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

  // @ApiProperty({ type: () => FileEntity })
  // @IsOptional()
  // @Validate(IsExist, ['FileEntity', 'id'], {
  //   message: 'imageNotExists',
  // })
  // photo?: FileEntity | null;

  @ApiProperty({ type: Role })
  @Validate(IsExist, ['Role', 'id'], {
    message: 'roleNotExists',
  })
  role?: Role | null;

  @ApiProperty({ type: Status })
  @Validate(IsExist, ['Status', 'id'], {
    message: 'statusNotExists',
  })
  status?: Status;

  hash?: string | null;
}
