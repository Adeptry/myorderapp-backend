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
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { nanoid } from 'nanoid';
import {
  ItemUpdateAllDto,
  ItemUpdateDto,
} from '../../catalogs/dto/item-update.dto.js';
import { ItemPaginatedResponse } from '../../catalogs/dto/items-paginated.output.js';
import { CatalogImage } from '../../catalogs/entities/catalog-image.entity.js';
import { Item } from '../../catalogs/entities/item.entity.js';
import { CatalogImagesService } from '../../catalogs/services/catalog-images.service.js';
import { CatalogSortService } from '../../catalogs/services/catalog-sort.service.js';
import { ItemsService } from '../../catalogs/services/items.service.js';
import { ApiKeyAuthGuard } from '../../guards/apikey-auth.guard.js';
import type { MerchantsGuardedRequest } from '../../guards/merchants.guard.js';
import { MerchantsGuard } from '../../guards/merchants.guard.js';
import { AppLogger } from '../../logger/app.logger.js';
import { SquareService } from '../../square/square.service.js';
import { UserTypeEnum } from '../../users/dto/type-user.dto.js';
import { NestError } from '../../utils/error.js';
import { paginatedResults } from '../../utils/paginated.js';

@ApiTags('Catalogs')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  version: '2',
})
export class ItemsController {
  constructor(
    private readonly service: ItemsService,
    private readonly catalogSortService: CatalogSortService,
    private readonly catalogImagesService: CatalogImagesService,
    private readonly squareService: SquareService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ItemsController.name);
  }

  @ApiBearerAuth()
  @ApiQuery({ name: 'merchantIdOrPath', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @Get('categories/:id/items')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ItemPaginatedResponse })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiQuery({ name: 'images', required: false, type: Boolean })
  @ApiQuery({ name: 'variations', required: false, type: Boolean })
  @ApiQuery({ name: 'modifierLists', required: false, type: Boolean })
  @ApiOperation({
    summary: 'Get Items in Category',
    operationId: 'getCategoriesItems',
  })
  async getCategoriesItems(
    @Param('id') categoryId: string,
    @Query('actingAs') actingAs: UserTypeEnum,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('locationId') locationId?: string,
    @Query('images') images?: boolean,
    @Query('variations') variations?: boolean,
    @Query('modifierLists') modifierLists?: boolean,
  ): Promise<ItemPaginatedResponse> {
    this.logger.verbose(this.getCategoriesItems.name);
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

    const results = await this.service
      .joinManyQuery({
        categoryId,
        locationId,
        page: parsedPage,
        limit: parsedLimit,
        leftJoinImages: images,
        leftJoinModifierLists: modifierLists,
        leftJoinVariations: variations,
        whereOnlyEnabled: actingAs === UserTypeEnum.customer,
      })
      .getManyAndCount();

    return paginatedResults({
      results: [this.catalogSortService.sortItems(results[0]), results[1]],
      pagination: { page: parsedPage ?? 0, limit: parsedLimit ?? 0 },
    });
  }

  @ApiBearerAuth()
  @Get('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Item })
  @ApiOperation({ summary: 'Get Item with ID', operationId: 'getItem' })
  @ApiNotFoundResponse({ description: 'Item not found', type: NestError })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  async getItem(
    @Param('id') id: string,
    @Query('locationId') locationId?: string,
  ): Promise<Item> {
    this.logger.verbose(this.getItem.name);
    const entity = await this.service
      .joinOneQuery({
        id,
        locationId,
        leftJoinImages: true,
        leftJoinModifierLists: true,
        leftJoinVariations: true,
        whereOnlyEnabled: true,
      })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }

    entity.itemModifierLists?.forEach((itemModifierList) => {
      itemModifierList.modifierList?.modifiers?.sort(
        (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0),
      );
    });

    return entity;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch('items/:id')
  @ApiOkResponse({ type: Item }) // Assuming you have an Item model similar to Category
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({ summary: 'Update an Item', operationId: 'patchItem' })
  async patchItem(
    @Param('id') itemId: string,
    @Body() input: ItemUpdateDto,
  ): Promise<Item> {
    this.logger.verbose(this.patchItem.name);
    return this.service.updateOne({
      id: itemId,
      input,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch('/items')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [Item] }) // Array of Item
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiBody({ type: [ItemUpdateAllDto] })
  @ApiOperation({
    summary: 'Update multiple Items',
    operationId: 'patchItems',
  })
  async patchItems(@Body() input: ItemUpdateAllDto[]): Promise<Item[]> {
    this.logger.verbose(this.patchItems.name);
    const items = await this.service.updateAll(input);
    await Promise.all(
      items.map(async (item) => {
        item.images = await this.service.loadManyRelation(item, 'images');
      }),
    );
    return items;
  }

  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBearerAuth()
  @Post('items/:id/square/image/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiCreatedResponse({ type: CatalogImage })
  @ApiQuery({
    name: 'idempotencyKey',
    required: true,
    type: String,
    example: nanoid(),
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload a catalog image',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload Square Catalog Image',
    operationId: 'postItemSquareImageUpload',
  })
  async postItemSquareImageUpload(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: MerchantsGuardedRequest,
    @Query('idempotencyKey') idempotencyKey: string,
    @Param('id') id: string,
  ) {
    this.logger.verbose(this.postItemSquareImageUpload.name);
    const { merchant } = request;

    if (!merchant.squareAccessToken) {
      throw new BadRequestException(
        'Merchant does not have Square access token',
      );
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const item = await this.service.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }

    const squareResponse = await this.squareService.uploadCatalogImage({
      accessToken: merchant.squareAccessToken,
      idempotencyKey,
      objectId: item.squareId,
      file,
    });

    console.log(squareResponse);

    const squareCatalogImage = squareResponse.image;
    const moaCatalogImage = this.catalogImagesService.create({
      item,
      squareId: squareCatalogImage?.id,
      name: squareCatalogImage?.imageData?.name,
      url: squareCatalogImage?.imageData?.url,
      caption: squareCatalogImage?.imageData?.caption,
      catalogId: item.catalogId,
    });

    return moaCatalogImage.save();
  }
}
