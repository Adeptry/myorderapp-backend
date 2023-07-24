import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@ApiSecurity('Api-Key')
@Controller({
  path: 'health',
  version: '2',
})
export class HealthController {
  constructor(
    private service: HealthCheckService,
    private dbHealthIndicator: TypeOrmHealthIndicator,
  ) {}

  @Get('database')
  @HealthCheck()
  @ApiExcludeEndpoint()
  checkDatabase() {
    return this.service.check([
      () => this.dbHealthIndicator.pingCheck('database'),
    ]);
  }

  @Get('error')
  @ApiExcludeEndpoint()
  throwServerError() {
    throw new InternalServerErrorException();
  }
}
