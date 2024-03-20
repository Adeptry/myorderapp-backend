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
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { lowerCaseTransformer } from '../../utils/lower-case.transformer.js';

export class AuthenticationEmailRegisterRequestBody {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @Length(3, 512)
  email!: string;

  @ApiProperty({ example: '123456' })
  @Length(6, 512)
  password!: string;

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
