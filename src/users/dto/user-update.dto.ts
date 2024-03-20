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
  @Validate(IsNotExist, ['user'], {
    message: 'User with this email already exists.',
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
