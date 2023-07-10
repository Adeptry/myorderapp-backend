import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
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
import { paginated } from 'src/utils/paginated';
import { MoaCategoryPaginatedResponse } from '../dto/categories-paginated.output';
import { MoaItemPaginatedResponse } from '../dto/items-paginated.output';
import { ItemsService } from '../services/items.service';

@ApiTags('Catalogs')
@Controller({
  path: 'categories',
  version: '2',
})
export class CategoriesController {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => ItemsService))
    private readonly itemsService: ItemsService,
    @Inject(forwardRef(() => MerchantsService))
    private readonly merchantsService: MerchantsService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MoaCategoryPaginatedResponse })
  @ApiQuery({ name: 'onlyShowEnabled', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async categories(
    @Req() request: any,
    @Query('onlyShowEnabled') onlyShowEnabled = false,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<MoaCategoryPaginatedResponse> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    return this.merchantsService.getManyCategoriesForUser({
      user,
      onlyShowEnabled,
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/items')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MoaItemPaginatedResponse })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async category(
    @Req() request: any,
    @Param('id') categoryId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<MoaItemPaginatedResponse> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const pagination = { page, limit };
    const findAndCount = await this.itemsService.findAndCount({
      where: { categoryId },
      take: limit,
      skip: (page - 1) * limit,
    });

    return paginated({
      data: findAndCount[0],
      count: findAndCount[1],
      pagination,
    });
  }
}
