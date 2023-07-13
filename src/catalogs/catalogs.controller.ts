import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  UserTypeGuard,
  UserTypeGuardedRequest,
} from 'src/guards/user-type.guard';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { NestError } from 'src/utils/error';
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
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiQuery({ name: 'as', required: false, enum: UserTypeEnum })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Catalog })
  @ApiOperation({ summary: 'Get your Catalog', operationId: 'getMyCatalog' })
  @ApiNotFoundResponse({ description: 'Catalog not found', type: NestError })
  async catalog(@Req() request: UserTypeGuardedRequest): Promise<Catalog> {
    if (!request.merchant.catalogId) {
      throw new NotFoundException(`Catalog not found`);
    }

    const entity = await this.service.joinOne({
      catalogId: request.merchant.catalogId,
      onlyShowEnabled: request.customer != undefined,
    });

    if (!entity) {
      throw new NotFoundException(`Catalog not found`);
    }

    return entity;
  }
}
