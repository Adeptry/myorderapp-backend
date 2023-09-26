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
import { ApiKeyAuthGuard } from '../../authentication/apikey-auth.guard.js';
import { CategoryPaginatedResponse } from '../../catalogs/dto/categories-paginated.output.js';
import {
  CategoryUpdateAllDto,
  CategoryUpdateDto,
} from '../../catalogs/dto/category-update.dto.js';
import { Category } from '../../catalogs/entities/category.entity.js';
import { CategoriesService } from '../../catalogs/services/categories.service.js';
import type { UserTypeGuardedRequest } from '../../customers/customer-merchant.guard.js';
import { CustomerMerchantGuard } from '../../customers/customer-merchant.guard.js';
import { MerchantsGuard } from '../../merchants/merchants.guard.js';
import { MerchantsService } from '../../merchants/merchants.service.js';
import { UserTypeEnum } from '../../users/dto/type-user.dto.js';
import { ErrorResponse } from '../../utils/error-response.js';

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
  ) {
    this.logger.verbose(this.constructor.name);
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
    const merchant = await this.merchantsService.findOneByIdOrPath({
      where: { idOrPath: merchantIdOrPath },
      relations: {
        catalog: true,
      },
    });

    if (!merchant || !merchant.catalog?.id) {
      throw new NotFoundException('Merchants catalog not found');
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
    const { merchant: requestMerchant, customer } = request;
    const whereOnlyEnabled = customer != undefined ? true : undefined;

    const merchant = await this.merchantsService.findOne({
      where: { id: requestMerchant.id },
      relations: {
        catalog: true,
      },
    });

    if (!merchant || !merchant.catalog?.id || !requestMerchant.id) {
      throw new NotFoundException('Merchants catalog not found');
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
  @ApiOkResponse({ type: Category })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({ summary: 'Update a Category', operationId: 'patchCategory' })
  async patchCategory(
    @Param('id') id: string,
    @Body() body: CategoryUpdateDto,
  ): Promise<Category> {
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
  @ApiOkResponse({ type: [Category] }) // array of Category
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiBody({ type: [CategoryUpdateAllDto] })
  @ApiOperation({
    summary: 'Update multiple Categories',
    operationId: 'patchCategories',
  })
  async patchCategories(
    @Body() body: CategoryUpdateAllDto[],
  ): Promise<Category[]> {
    this.logger.verbose(this.patchCategories.name);
    return await this.service.updateAll(body);
  }
}
