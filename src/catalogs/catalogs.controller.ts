import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Catalogs')
@Controller({
  path: 'catalogs',
  version: '2',
})
export class CatalogsController {}
