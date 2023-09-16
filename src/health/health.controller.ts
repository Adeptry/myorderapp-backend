import {
  Controller,
  Get,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import * as Sentry from '@sentry/node';
import { nanoid } from 'nanoid';
import { AdminsGuard } from '../guards/admins.guard.js';

@ApiTags('Health')
@Controller({
  path: 'health',
  version: '2',
})
export class HealthController {
  constructor(
    private readonly service: HealthCheckService,
    private readonly dbHealthIndicator: TypeOrmHealthIndicator,
    private readonly httpHealthIndicator: HttpHealthIndicator,
  ) {}

  @Get('database')
  @HealthCheck()
  @ApiOperation({ summary: 'Check database health' })
  @ApiResponse({ status: 200, description: 'Database is healthy' })
  @ApiResponse({ status: 503, description: 'Database is down' })
  database() {
    return this.service.check([
      () => this.dbHealthIndicator.pingCheck('database'),
    ]);
  }

  @ApiSecurity('Api-Key')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AdminsGuard)
  @Get('error')
  @ApiOperation({ summary: 'Trigger an internal server error' })
  @ApiResponse({ status: 500, description: 'Internal Server Error triggered' })
  error() {
    throw new InternalServerErrorException(nanoid());
  }

  @ApiSecurity('Api-Key')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AdminsGuard)
  @Get('sentry/error')
  @ApiOperation({ summary: 'Trigger an internal server error' })
  @ApiResponse({ status: 500, description: 'Internal Server Error triggered' })
  sentryError() {
    const transaction = Sentry.startTransaction({
      op: 'test',
      name: 'test-transaction',
    });

    setTimeout(() => {
      try {
        throw new InternalServerErrorException(nanoid());
      } catch (e) {
        Sentry.captureException(e);
      } finally {
        transaction.finish();
      }
    }, 99);
  }

  @ApiSecurity('Api-Key')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AdminsGuard)
  @Get('http')
  @HealthCheck()
  @ApiOperation({ summary: 'Check HTTP health by pinging NestJS docs' })
  @ApiResponse({ status: 200, description: 'HTTP ping successful' })
  @ApiResponse({ status: 503, description: 'HTTP ping failed' })
  http() {
    return this.service.check([
      () =>
        this.httpHealthIndicator.pingCheck(
          'nestjs-docs',
          'https://docs.nestjs.com',
        ),
    ]);
  }
}
