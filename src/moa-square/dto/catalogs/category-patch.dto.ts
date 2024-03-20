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
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CategoryPatchBody {
  @ApiProperty({ nullable: true, required: false })
  @IsNumber()
  @IsOptional()
  moaOrdinal?: number;

  @ApiProperty({ nullable: true, required: false })
  @IsBoolean()
  @IsOptional()
  moaEnabled?: boolean;
}

export class CategoriesPatchBody {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ nullable: true, required: false })
  @IsNumber()
  @IsOptional()
  moaOrdinal?: number;

  @ApiProperty({ nullable: true, required: false })
  @IsBoolean()
  @IsOptional()
  moaEnabled?: boolean;
}
