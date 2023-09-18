import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { CategoryPaginatedResponse } from '../../catalogs/dto/categories-paginated.output.js';
import {
  CategoryUpdateAllDto,
  CategoryUpdateDto,
} from '../../catalogs/dto/category-update.dto.js';
import { Category } from '../../catalogs/entities/category.entity.js';
import { CategoriesService } from '../../catalogs/services/categories.service.js';
import { ApiKeyAuthGuard } from '../../guards/apikey-auth.guard.js';
import { MerchantsGuard } from '../../guards/merchants.guard.js';
import type { UserTypeGuardedRequest } from '../../guards/user-type.guard.js';
import { UserTypeGuard } from '../../guards/user-type.guard.js';
import { MerchantsService } from '../../merchants/merchants.service.js';
import { UserTypeEnum } from '../../users/dto/type-user.dto.js';
import { NestError } from '../../utils/error.js';

@ApiTags('Catalogs')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  version: '2',
})
export class CategoriesController {
  constructor(
    private readonly service: CategoriesService,
    private readonly merchantsService: MerchantsService,
  ) {}

  @ApiBearerAuth()
  @Get('catalog')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CategoryPaginatedResponse })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiQuery({ name: 'actingAs', required: true, enum: UserTypeEnum })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'items', required: false, type: Boolean })
  @ApiQuery({ name: 'images', required: false, type: Boolean })
  @ApiQuery({ name: 'variations', required: false, type: Boolean })
  @ApiQuery({ name: 'modifierLists', required: false, type: Boolean })
  @ApiOperation({
    summary:
      'Get Categories for Merchant ID with Items, Variations, and/or ModifierLists',
    operationId: 'getCatalog',
  })
  @ApiNotFoundResponse({ description: 'Catalog not found', type: NestError })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  async categories(
    @Query('merchantId') merchantId: string,
    @Query('actingAs') actingAs: UserTypeEnum,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('locationId') locationId?: string,
    @Query('items') items?: boolean,
    @Query('images') images?: boolean,
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
    const merchant = await this.merchantsService.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    if (!merchant.catalogId) {
      throw new NotFoundException(`Catalog not found`);
    }

    return this.service.findPaginatedResults({
      catalogId: merchant.catalogId,
      page: parsedPage,
      limit: parsedLimit,
      whereOnlyEnabled: actingAs === UserTypeEnum.customer ? true : undefined,
      locationId,
      leftJoinItems: items,
      leftJoinVariations: variations,
      leftJoinModifierLists: modifierLists,
      leftJoinImages: images,
    });
  }

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
  @ApiQuery({ name: 'images', required: false, type: Boolean })
  @ApiQuery({ name: 'variations', required: false, type: Boolean })
  @ApiQuery({ name: 'modifierLists', required: false, type: Boolean })
  @ApiOperation({
    summary: 'Get your Categories with Items, Variations, and/or ModifierLists',
    operationId: 'getMyCatalog',
  })
  @ApiNotFoundResponse({ description: 'Catalog not found', type: NestError })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  async myCategories(
    @Req() request: UserTypeGuardedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('locationId') locationId?: string,
    @Query('items') items?: boolean,
    @Query('images') images?: boolean,
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

    return this.service.findPaginatedResults({
      catalogId: merchant.catalogId,
      page: parsedPage,
      limit: parsedLimit,
      whereOnlyEnabled,
      locationId,
      leftJoinItems: items,
      leftJoinVariations: variations,
      leftJoinModifierLists: modifierLists,
      leftJoinImages: images,
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
