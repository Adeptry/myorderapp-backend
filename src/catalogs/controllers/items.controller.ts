import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
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
import { MerchantsGuard } from 'src/guards/merchants.guard';
import {
  UserTypeGuard,
  UserTypeGuardedRequest,
} from 'src/guards/user-type.guard';
import { UsersGuard } from 'src/guards/users.guard';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { NestError } from 'src/utils/error';
import { paginatedResults } from 'src/utils/paginated';
import { ItemUpdateAllDto, ItemUpdateDto } from '../dto/item-update.dto';
import { ItemPaginatedResponse } from '../dto/items-paginated.output';
import { Item } from '../entities/item.entity';
import { ItemsService } from '../services/items.service';

@ApiTags('Catalogs')
@Controller({
  path: 'items',
  version: '2',
})
export class ItemsController {
  private readonly logger = new Logger(ItemsController.name);

  constructor(private readonly service: ItemsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @Get(':id/items')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ItemPaginatedResponse })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiOperation({
    summary: 'Get Items in Category',
    operationId: 'getItemsInCategory',
  })
  async getItemsInCategory(
    @Req() request: UserTypeGuardedRequest,
    @Param('id') categoryId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('locationId') locationId?: string,
  ): Promise<ItemPaginatedResponse> {
    const { customer } = request;
    const whereEnabled = customer != undefined ? true : undefined;
    const results = await this.service
      .joinManyQuery({
        categoryId,
        locationId,
        page,
        limit,
        leftJoinDetails: true,
        whereEnabled,
      })
      .getManyAndCount();

    results[0].forEach((item) => {
      item.modifierLists?.forEach((modifierList) => {
        modifierList.modifiers?.sort(
          (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0),
        );
      });
    });

    return paginatedResults({
      results,
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @Get(':id')
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
    const entity = await this.service.joinOneQuery({ id, locationId }).getOne();

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
  @Patch(':id')
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
  @Patch()
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
