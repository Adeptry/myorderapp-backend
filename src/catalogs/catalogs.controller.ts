import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogsService } from './catalogs.service';

@ApiTags('Catalogs')
@Controller({
  path: 'catalogs',
  version: '2',
})
export class CatalogsController {
  constructor(private readonly service: CatalogsService) {}
}
