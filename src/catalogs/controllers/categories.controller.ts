import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
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
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CategoryPaginatedResponse } from 'src/catalogs/dto/categories-paginated.output';
import {
  CategoryUpdateAllDto,
  CategoryUpdateDto,
} from 'src/catalogs/dto/category-update.dto';
import { Category } from 'src/catalogs/entities/category.entity';
import { CatalogSortService } from 'src/catalogs/services/catalog-sort.service';
import { CategoriesService } from 'src/catalogs/services/categories.service';
import { ItemsService } from 'src/catalogs/services/items.service';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import {
  UserTypeGuard,
  UserTypeGuardedRequest,
} from 'src/guards/user-type.guard';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { NestError } from 'src/utils/error';
import { paginatedResults } from 'src/utils/paginated';

@ApiTags('Catalogs')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  version: '2',
})
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(
    private readonly service: CategoriesService,
    private readonly itemsService: ItemsService,
    private readonly catalogSortService: CatalogSortService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('catalog/me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CategoryPaginatedResponse })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'items', required: false, type: Boolean })
  @ApiQuery({ name: 'variations', required: false, type: Boolean })
  @ApiQuery({ name: 'modifierLists', required: false, type: Boolean })
  @ApiOperation({
    summary: 'Get your Categories with Items, Variations, and ModifierLists',
    operationId: 'getCatalog',
  })
  @ApiNotFoundResponse({ description: 'Catalog not found', type: NestError })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  async categories(
    @Req() request: UserTypeGuardedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('locationId') locationId?: string,
    @Query('items') items?: boolean,
    @Query('variations') variations?: boolean,
    @Query('modifierLists') modifierLists?: boolean,
  ): Promise<CategoryPaginatedResponse> {
    let parsedPage: number | undefined;
    if (page !== undefined) {
      parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage)) {
        throw new BadRequestException(
          'Validation failed (numeric string is expected)',
        );
      }
    }
    let parsedLimit: number | undefined;
    if (limit !== undefined) {
      parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit)) {
        throw new BadRequestException(
          'Validation failed (numeric string is expected)',
        );
      }
    }
    const { merchant, customer } = request;
    const whereOnlyEnabled = customer != undefined ? true : undefined;

    if (!merchant.catalogId) {
      throw new NotFoundException(`Catalog not found`);
    }
    const results = await this.service.findAndCount({
      where: {
        catalogId: merchant.catalogId,
        moaEnabled: whereOnlyEnabled,
      },
      order: { moaOrdinal: 'ASC' },
      take: parsedLimit,
      skip: parsedPage && parsedLimit && (parsedPage - 1) * parsedLimit,
    });

    if (items) {
      await Promise.all(
        results[0].map(async (category) => {
          if (!category.id) {
            return;
          }

          category.items = this.catalogSortService.sortItems(
            await this.itemsService
              .joinManyQuery({
                categoryId: category.id,
                locationId,
                leftJoinImages: true,
                leftJoinVariations: variations,
                leftJoinModifierLists: modifierLists,
                whereOnlyEnabled,
              })
              .getMany(),
          );
        }),
      );
    }

    return paginatedResults({
      results,
      pagination: {
        page: parsedPage ?? 0,
        limit: parsedLimit ?? 0,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch('categories/:id')
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
    @Body() input: CategoryUpdateDto,
  ): Promise<Category> {
    return this.service.assignAndSave({
      id,
      input,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [Category] }) // array of Category
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiBody({ type: [CategoryUpdateAllDto] })
  @ApiOperation({
    summary: 'Update multiple Categories',
    operationId: 'updateCategories',
  })
  async updateMultiple(
    @Body() input: CategoryUpdateAllDto[],
  ): Promise<Category[]> {
    return await this.service.updateAll(input);
  }
}
