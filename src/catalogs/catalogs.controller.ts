import { Controller, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';

@ApiTags('Catalogs')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'catalogs',
  version: '2',
})
export class CatalogsController {}
