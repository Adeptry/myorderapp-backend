import { Controller, Inject, forwardRef } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { CatalogsService } from './catalogs.service';

@ApiTags('Catalogs')
@Controller({
  path: 'catalog',
  version: '2',
})
export class CatalogsController {
  constructor(
    private readonly service: CatalogsService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => MerchantsService))
    private readonly merchantsService: MerchantsService,
  ) {}
}
