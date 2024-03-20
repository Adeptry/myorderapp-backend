/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

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
import { ApiKeyAuthGuard } from '../../authentication/apikey-auth.guard.js';
import { ErrorResponse } from '../../utils/error-response.js';
import { VariationPatchBody } from '../dto/catalogs/variation-patch.dto.js';
import { VariationEntity } from '../entities/variation.entity.js';
import { MerchantsGuard } from '../guards/merchants.guard.js';
import { VariationsService } from '../services/variations.service.js';

@ApiTags('Catalogs')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  version: '2',
})
export class VariationsController {
  private readonly logger = new Logger(VariationsController.name);

  constructor(private readonly service: VariationsService) {
    this.logger.verbose(this.constructor.name);
  }

  @ApiBearerAuth()
  @Get('items/:id/variations')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: VariationEntity, isArray: true })
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
  ): Promise<VariationEntity[]> {
    this.logger.verbose(this.get.name);
    return await this.service.joinManyQuery({ itemId, locationId }).getMany();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch('variations/:id')
  @ApiOkResponse({ type: VariationEntity })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({
    summary: 'Update an Variation',
    operationId: 'patchVariation',
  })
  async patch(
    @Param('id') variationId: string,
    @Body() body: VariationPatchBody,
  ): Promise<VariationEntity> {
    this.logger.verbose(this.patch.name);
    return this.service.updateOne({
      id: variationId,
      input: body,
    });
  }
}
