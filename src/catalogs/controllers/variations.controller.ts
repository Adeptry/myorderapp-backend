import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { ApiKeyAuthGuard } from '../../guards/apikey-auth.guard.js';
import { MerchantsGuard } from '../../guards/merchants.guard.js';
import { AppLogger } from '../../logger/app.logger.js';
import { ErrorResponse } from '../../utils/error-response.js';
import { VariationUpdateDto } from '../dto/variation-update.dto.js';
import { Variation } from '../entities/variation.entity.js';
import { VariationsService } from '../services/variations.service.js';

@ApiTags('Catalogs')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  version: '2',
})
export class VariationsController {
  constructor(
    private readonly service: VariationsService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(VariationsController.name);
  }

  @ApiBearerAuth()
  @Get('items/:id/variations')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Variation, isArray: true })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiOperation({
    summary: 'Get Item variations with ID',
    operationId: 'getVariationsForItem',
  })
  @ApiNotFoundResponse({ description: 'Item not found', type: ErrorResponse })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  async get(
    @Param('id') itemId: string,
    @Query('locationId') locationId?: string,
  ): Promise<Variation[]> {
    this.logger.verbose(this.get.name);
    return await this.service.joinManyQuery({ itemId, locationId }).getMany();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch('variations/:id')
  @ApiOkResponse({ type: Variation })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({
    summary: 'Update an Variation',
    operationId: 'updateVariation',
  })
  async patch(
    @Param('id') variationId: string,
    @Body() input: VariationUpdateDto,
  ): Promise<Variation> {
    this.logger.verbose(this.patch.name);
    return this.service.updateOne({
      id: variationId,
      input,
    });
  }
}
