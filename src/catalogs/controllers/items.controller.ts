import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Patch,
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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import { UsersGuard } from 'src/guards/users.guard';
import { NestError } from 'src/utils/error';
import { ItemUpdateAllInput, ItemUpdateInput } from '../dto/item-update.dto';
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
  async item(@Param('id') itemId: string): Promise<Item> {
    const entity = await this.service.findOne({
      where: { id: itemId },
      relations: ['variations', 'modifierLists'],
    });

    if (!entity) {
      throw new NotFoundException(`Item with id ${itemId} not found`);
    }

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
    @Body() input: ItemUpdateInput,
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
  @ApiBody({ type: [ItemUpdateAllInput] })
  @ApiOperation({
    summary: 'Update multiple Items',
    operationId: 'updateItems',
  })
  async updateItems(@Body() input: ItemUpdateAllInput[]): Promise<Item[]> {
    return await this.service.updateAll(input);
  }
}
