import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserTypeGuard } from 'src/guards/user-type.guard';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { CatalogsService } from './catalogs.service';
import { Catalog } from './entities/catalog.entity';

@ApiTags('Catalogs')
@Controller({
  path: 'catalogs',
  version: '2',
})
export class CatalogsController {
  constructor(private readonly service: CatalogsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Catalog })
  @ApiQuery({ name: 'as', required: true, enum: UserTypeEnum })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiOperation({ summary: 'Get your Catalog' })
  async catalog(
    @Req() request: any,
    @Param('as') as: UserTypeEnum,
  ): Promise<Catalog> {
    const entity = await this.service.joinOne({
      catalogId: request.merchant.catalogId,
      onlyShowEnabled: as === UserTypeEnum.customer,
    });

    if (!entity) {
      throw new NotFoundException(`Catalog not found`);
    }

    return entity;
  }
}
