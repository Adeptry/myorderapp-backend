import { Controller, Get, Param, Patch } from '@nestjs/common';
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

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.appConfigService.update(id);
  }
}
