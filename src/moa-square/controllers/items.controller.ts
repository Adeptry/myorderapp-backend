import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
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
import type { ConfigType } from '@nestjs/config';
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
import { NestSquareService } from 'nest-square';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { InjectS3, type S3 } from 'nestjs-s3';
import path from 'path';
import { ApiKeyAuthGuard } from '../../authentication/apikey-auth.guard.js';
import { AwsS3Config } from '../../configs/aws-s3.config.js';
import { buildPaginatedResults } from '../../database/build-paginated-results.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { UserTypeEnum } from '../../users/dto/type-user.dto.js';
import { ErrorResponse } from '../../utils/error-response.js';
import {
  ItemPatchBody,
  ItemsPatchBody,
} from '../dto/catalogs/item-patch.dto.js';
import { ItemPaginatedResponse } from '../dto/catalogs/items-paginated.output.js';
import { CatalogImageEntity } from '../entities/catalog-image.entity.js';
import { ItemEntity } from '../entities/item.entity.js';
import type { MerchantsGuardedRequest } from '../guards/merchants.guard.js';
import { MerchantsGuard } from '../guards/merchants.guard.js';
import { MyOrderAppSquareConfig } from '../moa-square.config.js';
import { CatalogImagesService } from '../services/catalog-images.service.js';
import { CatalogSortService } from '../services/catalog-sort.service.js';
import { ItemsService } from '../services/items.service.js';

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
    private readonly squareService: NestSquareService,
    private readonly i18n: I18nService<I18nTranslations>,
    @InjectS3()
    private readonly s3: S3,
    @Inject(AwsS3Config.KEY)
    protected awsS3Config: ConfigType<typeof AwsS3Config>,
    @Inject(MyOrderAppSquareConfig.KEY)
    private readonly config: ConfigType<typeof MyOrderAppSquareConfig>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  translations() {
    return this.i18n.t('moaSquare', {
      lang: I18nContext.current()?.lang,
    });
  }

  @ApiBearerAuth()
  @ApiQuery({ name: 'merchantIdOrPath', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @Get('categories/:id/items')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ItemPaginatedResponse })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
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

    return buildPaginatedResults({
      results: [this.catalogSortService.sortItems(results[0]), results[1]],
      pagination: { page: parsedPage ?? 0, limit: parsedLimit ?? 0 },
    });
  }

  @ApiBearerAuth()
  @Get('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ItemEntity })
  @ApiOperation({ summary: 'Get Item with ID', operationId: 'getItem' })
  @ApiNotFoundResponse({ description: 'Item not found', type: ErrorResponse })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  async getItem(
    @Param('id') id: string,
    @Query('locationId') locationId?: string,
  ): Promise<ItemEntity> {
    this.logger.verbose(this.getItem.name);
    const translations = this.translations();
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
      throw new NotFoundException(translations.itemsNotFound);
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
  @ApiOkResponse({ type: ItemEntity }) // Assuming you have an Item model similar to Category
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({ summary: 'Update an Item', operationId: 'patchItem' })
  async patchItem(
    @Param('id') itemId: string,
    @Body() body: ItemPatchBody,
  ): Promise<ItemEntity> {
    this.logger.verbose(this.patchItem.name);
    return this.service.updateOne({
      id: itemId,
      input: body,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch('/items')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [ItemEntity] }) // Array of Item
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiBody({ type: [ItemsPatchBody] })
  @ApiOperation({
    summary: 'Update multiple Items',
    operationId: 'patchItems',
  })
  async patchItems(@Body() body: ItemsPatchBody[]): Promise<ItemEntity[]> {
    this.logger.verbose(this.patchItems.name);
    const items = await this.service.updateAll(body);
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
  @ApiCreatedResponse({ type: CatalogImageEntity })
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
    const { merchant } = request;

    this.logger.verbose(this.postItemSquareImageUpload.name);
    const translations = this.translations();

    if (!merchant.squareAccessToken) {
      throw new BadRequestException(
        translations.merchantsSquareAccessTokenNotFound,
      );
    }

    if (!file) {
      throw new BadRequestException(translations.fileNotFound);
    }

    const item = await this.service.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException(translations.itemsNotFound);
    }

    if (this.config.squareTestUseS3) {
      const fileExtension = path.extname(file.originalname).toLowerCase();

      let contentType: string;

      if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
        contentType = 'image/jpeg';
      } else if (fileExtension === '.png') {
        contentType = 'image/png';
      } else {
        throw new BadRequestException('Invalid file type'); // You can customize this message
      }
      const key = `${encodeURIComponent(Date.now())}-${encodeURIComponent(
        file.originalname,
      )}`;
      const { defaultBucket, region } = this.awsS3Config;
      try {
        await this.s3.putObject({
          Bucket: defaultBucket,
          Key: key,
          Body: file.buffer,
          ContentType: contentType,
          ContentDisposition: 'inline',
        });
      } catch (error) {
        this.logger.error(error);
        throw new InternalServerErrorException(error);
      }

      const iconFileFullUrl = `https://${defaultBucket}.s3.${region}.amazonaws.com/${key}`;
      const moaCatalogImage = this.catalogImagesService.create({
        item,
        squareId: nanoid(),
        name: key,
        url: iconFileFullUrl,
        caption: '',
        catalogId: item.catalogId,
      });

      return moaCatalogImage.save();
    } else {
      const squareResponse = await this.squareService.uploadCatalogImageOrThrow(
        {
          accessToken: merchant.squareAccessToken,
          idempotencyKey,
          objectId: item.squareId,
          id: nanoid(),
          file,
        },
      );

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
}
