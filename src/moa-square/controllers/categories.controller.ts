/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseBoolPipe,
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
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiKeyAuthGuard } from '../../authentication/apikey-auth.guard.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { UserTypeEnum } from '../../users/dto/type-user.dto.js';
import { ErrorResponse } from '../../utils/error-response.js';
import { CategoryPaginatedResponse } from '../dto/catalogs/categories-paginated.output.js';
import {
  CategoriesPatchBody,
  CategoryPatchBody,
} from '../dto/catalogs/category-patch.dto.js';
import { CategoryEntity } from '../entities/category.entity.js';
import type { UserTypeGuardedRequest } from '../guards/customer-merchant.guard.js';
import { CustomerMerchantGuard } from '../guards/customer-merchant.guard.js';
import { MerchantsGuard } from '../guards/merchants.guard.js';
import { CategoriesService } from '../services/categories.service.js';
import { MerchantsService } from '../services/merchants.service.js';

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
    private readonly merchantsService: MerchantsService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  translations() {
    return this.i18n.t('moaSquare', {
      lang: I18nContext.current()?.lang,
    });
  }

  @ApiBearerAuth()
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CategoryPaginatedResponse })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
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
    operationId: 'getCategories',
  })
  @ApiNotFoundResponse({
    description: 'Catalog not found',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  async getCategories(
    @Query('merchantIdOrPath') merchantIdOrPath: string,
    @Query('actingAs') actingAs: UserTypeEnum,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('locationId') locationId?: string,
    @Query('items', new DefaultValuePipe(false), ParseBoolPipe) items?: boolean,
    @Query('images', new DefaultValuePipe(false), ParseBoolPipe)
    images?: boolean,
    @Query('variations', new DefaultValuePipe(false), ParseBoolPipe)
    variations?: boolean,
    @Query('modifierLists', new DefaultValuePipe(false), ParseBoolPipe)
    modifierLists?: boolean,
  ): Promise<CategoryPaginatedResponse> {
    this.logger.verbose(this.getCategories.name);
    const translations = this.translations();
    let parsedPage: number | undefined;
    if (page !== undefined) {
      parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage)) {
        throw new BadRequestException(translations.paginationIsNaN);
      }
    }
    let parsedLimit: number | undefined;
    if (limit !== undefined) {
      parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit)) {
        throw new BadRequestException(translations.paginationIsNaN);
      }
    }
    const merchant = await this.merchantsService.findOneByIdOrPath({
      where: { idOrPath: merchantIdOrPath },
      relations: {
        catalog: true,
      },
    });

    if (!merchant || !merchant.catalog?.id) {
      throw new NotFoundException(translations.catalogsNotFound);
    }

    return this.service.findPaginatedResults({
      catalogId: merchant.catalog?.id,
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
  @UseGuards(AuthGuard('jwt'), CustomerMerchantGuard)
  @Get('categories/me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CategoryPaginatedResponse })
  @ApiQuery({ name: 'merchantIdOrPath', required: false, type: String })
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
    operationId: 'getCategoriesMe',
  })
  @ApiNotFoundResponse({
    description: 'Catalog not found',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  async getCategoriesMe(
    @Req() request: UserTypeGuardedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('locationId') locationId?: string,
    @Query('items', new DefaultValuePipe(false), ParseBoolPipe) items?: boolean,
    @Query('images', new DefaultValuePipe(false), ParseBoolPipe)
    images?: boolean,
    @Query('variations', new DefaultValuePipe(false), ParseBoolPipe)
    variations?: boolean,
    @Query('modifierLists', new DefaultValuePipe(false), ParseBoolPipe)
    modifierLists?: boolean,
  ): Promise<CategoryPaginatedResponse> {
    this.logger.verbose(this.getCategoriesMe.name);
    const translations = this.translations();
    let parsedPage: number | undefined;
    if (page !== undefined) {
      parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage)) {
        throw new BadRequestException(translations.paginationIsNaN);
      }
    }
    let parsedLimit: number | undefined;
    if (limit !== undefined) {
      parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit)) {
        throw new BadRequestException(translations.paginationIsNaN);
      }
    }
    const { merchant: requestMerchant, customer } = request;
    const whereOnlyEnabled = customer != undefined ? true : undefined;

    const merchant = await this.merchantsService.findOne({
      where: { id: requestMerchant.id },
      relations: {
        catalog: true,
      },
    });

    if (!merchant || !merchant.catalog?.id || !requestMerchant.id) {
      throw new NotFoundException(translations.catalogsNotFound);
    }

    return this.service.findPaginatedResults({
      catalogId: merchant.catalog.id,
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
  @ApiOkResponse({ type: CategoryEntity })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({ summary: 'Update a Category', operationId: 'patchCategory' })
  async patchCategory(
    @Param('id') id: string,
    @Body() body: CategoryPatchBody,
  ): Promise<CategoryEntity> {
    this.logger.verbose(this.patchCategory.name);
    return this.service.updateOne({
      id,
      input: body,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [CategoryEntity] }) // array of Category
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiBody({ type: [CategoriesPatchBody] })
  @ApiOperation({
    summary: 'Update multiple Categories',
    operationId: 'patchCategories',
  })
  async patchCategories(
    @Body() body: CategoriesPatchBody[],
  ): Promise<CategoryEntity[]> {
    this.logger.verbose(this.patchCategories.name);
    return await this.service.updateAll(body);
  }
}
