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

import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller({
  path: 'health',
  version: '2',
})
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly service: HealthCheckService,
    private readonly dbHealthIndicator: TypeOrmHealthIndicator,
    private readonly httpHealthIndicator: HttpHealthIndicator,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  @Get('database')
  @HealthCheck()
  @ApiOperation({ summary: 'Check database health' })
  @ApiResponse({ status: 200, description: 'Database is healthy' })
  @ApiResponse({ status: 503, description: 'Database is down' })
  database() {
    this.logger.verbose(this.database.name);
    return this.service.check([
      () => this.dbHealthIndicator.pingCheck('database'),
    ]);
  }

  @Get('error')
  @ApiOperation({ summary: 'Trigger an internal server error' })
  @ApiResponse({ status: 500, description: 'Internal Server Error triggered' })
  error() {
    this.logger.verbose(this.error.name);
    throw new InternalServerErrorException(new Date().toISOString());
  }

  @Get('http')
  @HealthCheck()
  @ApiOperation({ summary: 'Check HTTP health by pinging NestJS docs' })
  @ApiResponse({ status: 200, description: 'HTTP ping successful' })
  @ApiResponse({ status: 503, description: 'HTTP ping failed' })
  http() {
    this.logger.verbose(this.http.name);
    return this.service.check([
      () =>
        this.httpHealthIndicator.pingCheck(
          'nestjs-docs',
          'https://docs.nestjs.com',
        ),
    ]);
  }
}
