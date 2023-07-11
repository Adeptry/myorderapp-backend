import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Req,
  UnauthorizedException,
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
import { AuthService } from 'src/auth/auth.service';
import { MerchantsService } from 'src/merchants/merchants.service';
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

  constructor(
    private readonly service: ItemsService,
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(MerchantsService)
    private readonly merchantsService: MerchantsService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Item })
  @ApiOperation({ summary: 'Get Item with ID' })
  async item(@Req() request: any, @Param('id') itemId: string): Promise<Item> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const foundOne = await this.service.findOne({
      where: { id: itemId },
    });

    if (!foundOne) {
      throw new NotFoundException(`Item with id ${itemId} not found`);
    }

    foundOne.variations = await this.service.loadVariations(foundOne);
    foundOne.modifierLists = await this.service.loadModifierLists(foundOne);

    return foundOne;
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @ApiOkResponse({ type: Item }) // Assuming you have an Item model similar to Category
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({ summary: 'Update an Item' })
  async updateItem(
    @Req() request: any,
    @Param('id') itemId: string,
    @Body() input: ItemUpdateInput,
  ): Promise<Item> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const merchant = await this.merchantsService.findOne({
      where: { userId: user.id },
    });

    if (!merchant) {
      throw new UnauthorizedException(
        'Merchant object does not exist after successful authentication',
      );
    }

    return this.service.assignAndSave({
      id: itemId,
      input,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [Item] }) // Array of Item
  @ApiBody({ type: [ItemUpdateAllInput] })
  @ApiOperation({ summary: 'Update multiple Items' })
  async updateMultipleItems(
    @Req() request: any,
    @Body() input: ItemUpdateAllInput[],
  ): Promise<Item[]> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const merchant = await this.merchantsService.findOne({
      where: { userId: user.id },
    });

    if (!merchant) {
      throw new UnauthorizedException(
        'Merchant object does not exist after successful authentication',
      );
    }

    return await this.service.updateAll(input);
  }
}
