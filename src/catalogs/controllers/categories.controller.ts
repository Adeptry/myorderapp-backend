import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
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
import {
  UserTypeGuard,
  UserTypeGuardedRequest,
} from 'src/guards/user-type.guard';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { NestError } from 'src/utils/error';
import { paginatedResults } from 'src/utils/paginated';

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
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiQuery({ name: 'as', required: false, enum: UserTypeEnum })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({
    summary: 'Get your Categories',
    operationId: 'getMyCategories',
  })
  @ApiNotFoundResponse({ description: 'Catalog not found', type: NestError })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  async categories(
    @Req() request: UserTypeGuardedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<CategoryPaginatedResponse> {
    if (!request.merchant.catalogId) {
      throw new NotFoundException(`Catalog not found`);
    }
    return paginatedResults({
      results: await this.service.findAndCount({
        where: {
          catalogId: request.merchant.catalogId,
          moaEnabled: request.customer != undefined ? true : undefined,
        },
        order: { moaOrdinal: 'ASC' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiQuery({ name: 'as', required: false, enum: UserTypeEnum })
  @Get(':id/items')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ItemPaginatedResponse })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get Items in Category', operationId: 'getItems' })
  async category(
    @Req() request: UserTypeGuardedRequest,
    @Param('id') categoryId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<ItemPaginatedResponse> {
    return paginatedResults({
      results: await this.itemsService.findAndCount({
        where: {
          categoryId,
          catalogId: request.merchant.catalogId,
          moaEnabled: request.customer?.id != undefined ? true : undefined,
        },
        order: { moaOrdinal: 'ASC' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch(':id')
  @ApiOkResponse({ type: Category })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({ summary: 'Update a Category', operationId: 'updateCategory' })
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
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiBody({ type: [CategoryUpdateAllInput] })
  @ApiOperation({
    summary: 'Update multiple Categories',
    operationId: 'updateCategories',
  })
  async updateMultiple(
    @Body() input: CategoryUpdateAllInput[],
  ): Promise<Category[]> {
    return await this.service.updateAll(input);
  }
}
