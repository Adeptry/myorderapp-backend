import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CategoryPaginatedResponse } from 'src/catalogs/dto/categories-paginated.output';
import {
  CategoryUpdateAllInput,
  CategoryUpdateInput,
} from 'src/catalogs/dto/category-update.dto';
import { ItemPaginatedResponse } from 'src/catalogs/dto/items-paginated.output';
import { Category } from 'src/catalogs/entities/category.entity';
import { CategoriesService } from 'src/catalogs/services/categories.service';
import { ItemsService } from 'src/catalogs/services/items.service';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import { UserTypeGuard } from 'src/guards/user-type.guard';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { paginated } from 'src/utils/paginated';

@ApiTags('Catalogs')
@Controller({
  path: 'categories',
  version: '2',
})
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(
    private readonly service: CategoriesService,
    @Inject(ItemsService)
    private readonly itemsService: ItemsService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CategoryPaginatedResponse })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'as', required: true, enum: UserTypeEnum })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiOperation({ summary: 'Get your Categories' })
  async categories(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('as') userType: UserTypeEnum,
  ): Promise<CategoryPaginatedResponse> {
    const results = await this.service.findAndCount({
      where: {
        catalogId: request.merchant.catalogId,
        moaEnabled: userType === UserTypeEnum.customer ? true : undefined,
      },
      order: { moaOrdinal: 'ASC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return paginated({
      data: results[0],
      count: results[1],
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get(':id/items')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ItemPaginatedResponse })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'as', required: true, enum: UserTypeEnum })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiOperation({ summary: 'Get Items in Category' })
  async category(
    @Req() request: any,
    @Param('id') categoryId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('as') userType: UserTypeEnum,
  ): Promise<ItemPaginatedResponse> {
    const results = await this.itemsService.findAndCount({
      where: {
        categoryId,
        catalogId: request.merchant.catalogId,
        moaEnabled: userType === UserTypeEnum.customer ? true : undefined,
      },
      order: { moaOrdinal: 'ASC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return paginated({
      data: results[0],
      count: results[1],
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch(':id')
  @ApiOkResponse({ type: Category })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({ summary: 'Update a Category' })
  async update(
    @Param('id') id: string,
    @Body() input: CategoryUpdateInput,
  ): Promise<Category> {
    return this.service.assignAndSave({
      id,
      input,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [Category] }) // array of Category
  @ApiBody({ type: [CategoryUpdateAllInput] })
  @ApiOperation({ summary: 'Update multiple Categories' })
  async updateMultiple(
    @Body() input: CategoryUpdateAllInput[],
  ): Promise<Category[]> {
    return await this.service.updateAll(input);
  }
}
