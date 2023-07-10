import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { CatalogsService } from './catalogs.service';
import { Catalog } from './entities/catalog.entity';

@ApiTags('Catalogs')
@Controller({
  path: 'catalogs',
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Catalog })
  @ApiQuery({ name: 'onlyShowEnabled', required: false, type: Boolean })
  async catalog(
    @Req() request: any,
    @Query('onlyShowEnabled') onlyShowEnabled = false,
  ): Promise<Catalog | null | undefined> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    return this.merchantsService.getOneOrderedCatalogOrFailForUser({
      user,
      onlyShowEnabled,
    });
  }
}
