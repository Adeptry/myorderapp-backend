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

export class ErrorResponse {
  @ApiProperty({ required: false, nullable: true })
  statusCode?: number;

  @ApiProperty({ required: false, nullable: true })
  message?: string;

  @ApiProperty({ required: false, nullable: true })
  url?: string;

  @ApiProperty({ required: false, nullable: true })
  method?: string;

  @ApiProperty({ required: false, nullable: true })
  timestamp?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  fields?: Record<string, string>;

  constructor(partial: Partial<ErrorResponse>) {
    Object.assign(this, partial);
  }
}
