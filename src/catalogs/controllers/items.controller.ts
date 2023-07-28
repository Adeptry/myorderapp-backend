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
import {
  ItemUpdateAllDto,
  ItemUpdateDto,
} from 'src/catalogs/dto/item-update.dto';
import { ItemPaginatedResponse } from 'src/catalogs/dto/items-paginated.output';
import { Item } from 'src/catalogs/entities/item.entity';
import { CatalogSortService } from 'src/catalogs/services/catalog-sort.service';
import { ItemsService } from 'src/catalogs/services/items.service';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import {
  UserTypeGuard,
  UserTypeGuardedRequest,
} from 'src/guards/user-type.guard';
import { UsersGuard } from 'src/guards/users.guard';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
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
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
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
    @Req() request: UserTypeGuardedRequest,
    @Param('id') categoryId: string,
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
    const { customer } = request;
    const whereOnlyEnabled = customer != undefined ? true : undefined;
    const results = await this.service
      .joinManyQuery({
        categoryId,
        locationId,
        page: parsedPage,
        limit: parsedLimit,
        leftJoinImages: images,
        leftJoinModifierLists: modifierLists,
        leftJoinVariations: variations,
        whereOnlyEnabled,
      })
      .getManyAndCount();

    return paginatedResults({
      results: [this.catalogSortService.sortItems(results[0]), results[1]],
      pagination: { page: parsedPage ?? 0, limit: parsedLimit ?? 0 },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @Get('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Item })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
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
    return await this.service.updateAll(input);
  }
}
