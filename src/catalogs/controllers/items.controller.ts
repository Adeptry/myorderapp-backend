import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { MoaItem } from '../entities/item.entity';
import { ItemsService } from '../services/items.service';

@ApiTags('Catalogs')
@Controller({
  path: 'items',
  version: '2',
})
export class ItemsController {
  constructor(
    @Inject(forwardRef(() => ItemsService))
    private readonly service: ItemsService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MoaItem })
  async item(
    @Req() request: any,
    @Param('id') itemMoaId: string,
  ): Promise<MoaItem> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const foundOne = await this.service.findOne({
      where: { moaId: itemMoaId },
    });

    if (!foundOne) {
      throw new NotFoundException(`Item with moaId ${itemMoaId} not found`);
    }

    foundOne.variations = await this.service.loadVariations(foundOne);
    foundOne.modifierLists = await this.service.loadModifierLists(foundOne);

    return foundOne;
  }
}
