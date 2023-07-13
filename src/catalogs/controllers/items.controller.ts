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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import { UsersGuard } from 'src/guards/users.guard';
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
  @ApiOperation({ summary: 'Get Item with ID' })
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
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({ summary: 'Update an Item' })
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
  @ApiBody({ type: [ItemUpdateAllInput] })
  @ApiOperation({ summary: 'Update multiple Items' })
  async updateMultipleItems(
    @Body() input: ItemUpdateAllInput[],
  ): Promise<Item[]> {
    return await this.service.updateAll(input);
  }
}
