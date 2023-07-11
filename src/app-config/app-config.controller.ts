import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppConfigService } from './app-config.service';

@ApiTags('App Config')
@Controller({
  path: 'app',
  version: '2',
})
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appConfigService.findOne({ where: { id } });
  }
}
