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
} from 'src/catalogs/dto/item-update.dto';
import { ItemPaginatedResponse } from 'src/catalogs/dto/items-paginated.output';
import { CatalogImage } from 'src/catalogs/entities/catalog-image.entity';
import { Item } from 'src/catalogs/entities/item.entity';
import { CatalogImagesService } from 'src/catalogs/services/catalog-images.service';
import { CatalogSortService } from 'src/catalogs/services/catalog-sort.service';
import { ItemsService } from 'src/catalogs/services/items.service';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import {
  MerchantsGuard,
  MerchantsGuardedRequest,
} from 'src/guards/merchants.guard';
import { SquareService } from 'src/square/square.service';
import { UserTypeEnum } from 'src/users/dto/type-user.dto';
import { NestError } from 'src/utils/error';
import { paginatedResults } from 'src/utils/paginated';

@ApiTags('Catalogs')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  version: '2',
})
export class ItemsController {
  private readonly logger = new Logger(ItemsController.name);

  constructor(
    private readonly service: ItemsService,
    private readonly catalogSortService: CatalogSortService,
    private readonly catalogImagesService: CatalogImagesService,
    private readonly squareService: SquareService,
  ) {}

  @ApiBearerAuth()
  @ApiQuery({ name: 'merchantId', required: false, type: String })
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
    operationId: 'getItemsInCategory',
  })
  async getItemsInCategory(
    @Param('id') categoryId: string,
    @Query('actingAs') actingAs: UserTypeEnum,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('locationId') locationId?: string,
    @Query('images') images?: boolean,
    @Query('variations') variations?: boolean,
    @Query('modifierLists') modifierLists?: boolean,
  ): Promise<ItemPaginatedResponse> {
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
  async item(
    @Param('id') id: string,
    @Query('locationId') locationId?: string,
  ): Promise<Item> {
    const entity = await this.service
      .joinOneQuery({
        id,
        locationId,
        leftJoinImages: true,
        leftJoinModifierLists: true,
        leftJoinVariations: true,
      })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }

    entity.modifierLists?.forEach((modifierList) => {
      modifierList.modifiers?.sort(
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
  @ApiOperation({ summary: 'Update an Item', operationId: 'updateItem' })
  async updateItem(
    @Param('id') itemId: string,
    @Body() input: ItemUpdateDto,
  ): Promise<Item> {
    return this.service.assignAndSave({
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
    operationId: 'updateItems',
  })
  async updateItems(@Body() input: ItemUpdateAllDto[]): Promise<Item[]> {
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
  @Post('items/:id/square/image')
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
    operationId: 'uploadImageToSquareCatalog',
  })
  async squareUploadCatalogFileForImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: MerchantsGuardedRequest,
    @Query('idempotencyKey') idempotencyKey: string,
    @Param('id') id: string,
  ) {
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
