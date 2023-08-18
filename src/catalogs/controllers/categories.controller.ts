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
import { CategoriesService } from 'src/catalogs/services/categories.service';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import {
  UserTypeGuard,
  UserTypeGuardedRequest,
} from 'src/guards/user-type.guard';
import { MerchantsService } from 'src/merchants/merchants.service';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { NestError } from 'src/utils/error';

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
  async categoriesForMerchantId(
    @Query('merchantId') merchantId: string,
    @Query('actingAs') actingAs: UserTypeEnum,
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
    const whereOnlyEnabled = actingAs === UserTypeEnum.customer;
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
      whereOnlyEnabled,
      locationId,
      leftJoinItems: items,
      leftJoinVariations: variations,
      leftJoinModifierLists: modifierLists,
      leftJoinImages: true,
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
      leftJoinImages: true,
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
