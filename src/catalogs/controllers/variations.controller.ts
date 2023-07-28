import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CatalogSortService } from 'src/catalogs/services/catalog-sort.service';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import { UsersGuard } from 'src/guards/users.guard';
import { NestError } from 'src/utils/error';
import { VariationUpdateDto } from '../dto/variation-update.dto';
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch('variations/:id')
  @ApiOkResponse({ type: Variation }) // Assuming you have an Item model similar to Category
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({
    summary: 'Update an Variation',
    operationId: 'updateVariation',
  })
  async updateVariation(
    @Param('id') variationId: string,
    @Body() input: VariationUpdateDto,
  ): Promise<Variation> {
    return this.service.assignAndSave({
      id: variationId,
      input,
    });
  }
}
