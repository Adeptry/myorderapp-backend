/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Validate,
} from 'class-validator';
import { IsExist } from '../../utils/is-exists.validator.js';
import { IsNotExist } from '../../utils/is-not-exists.validator.js';
import { lowerCaseTransformer } from '../../utils/lower-case.transformer.js';
import { RoleEntity } from '../entities/role.entity.js';
import { StatusEntity } from '../entities/status.entity.js';

export class UserCreateDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @Validate(IsNotExist, ['user'], {
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

  @ApiProperty({ type: RoleEntity })
  @Validate(IsExist, ['role', 'id'], {
    message: 'roleNotExists',
  })
  role?: RoleEntity | null;

  @ApiProperty({ type: StatusEntity })
  @Validate(IsExist, ['status', 'id'], {
    message: 'statusNotExists',
  })
  status?: StatusEntity;

  hash?: string | null;
}
