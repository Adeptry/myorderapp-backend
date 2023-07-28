import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CatalogSortService } from 'src/catalogs/services/catalog-sort.service';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import { UsersGuard } from 'src/guards/users.guard';
import { NestError } from 'src/utils/error';
import { Variation } from '../entities/variation.entity';
import { VariationsService } from '../services/variations.service';

@ApiTags('Catalogs')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  version: '2',
})
export class VariationsController {
  private readonly logger = new Logger(VariationsController.name);

  constructor(
    private readonly service: VariationsService,
    private readonly catalogSortService: CatalogSortService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @Get('items/:id/variations')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Variation, isArray: true })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOperation({
    summary: 'Get Item variations with ID',
    operationId: 'getVariationsForItem',
  })
  @ApiNotFoundResponse({ description: 'Item not found', type: NestError })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  async variations(
    @Param('id') itemId: string,
    @Query('locationId') locationId?: string,
  ): Promise<Variation[]> {
    return await this.service.joinManyQuery({ itemId, locationId }).getMany();
  }
}
