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
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiKeyAuthGuard } from '../../authentication/apikey-auth.guard.js';
import { buildPaginatedResults } from '../../database/build-paginated-results.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { UserTypeEnum } from '../../users/dto/type-user.dto.js';
import { ErrorResponse } from '../../utils/error-response.js';
import { LocationPatchBody } from '../dto/locations/location-patch-body.dto.js';
import { LocationPaginatedResponse } from '../dto/locations/locations-paginated-response.dto.js';
import { LocationsPatchBody } from '../dto/locations/locations-patch-body.dto.js';
import { LocationEntity as MoaLocation } from '../entities/location.entity.js';
import type { UserTypeGuardedRequest } from '../guards/customer-merchant.guard.js';
import { CustomerMerchantGuard } from '../guards/customer-merchant.guard.js';
import { MerchantsGuard } from '../guards/merchants.guard.js';
import { LocationsService } from '../services/locations.service.js';

@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@ApiTags('Locations')
@Controller('v2/locations')
export class LocationsController {
  private readonly logger = new Logger(LocationsController.name);

  constructor(
    private readonly service: LocationsService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  translations() {
    return this.i18n.t('moaSquare', {
      lang: I18nContext.current()?.lang,
    });
  }

  @ApiBearerAuth()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LocationPaginatedResponse })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'address', required: false, type: Boolean })
  @ApiQuery({ name: 'businessHours', required: false, type: Boolean })
  @ApiOperation({
    summary: 'Get Locations for Merchant',
    operationId: 'getLocations',
  })
  async getMany(
    @Query('merchantIdOrPath') merchantIdOrPath: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('address', new DefaultValuePipe(false), ParseBoolPipe)
    addressRelation?: boolean,
    @Query('businessHours', new DefaultValuePipe(false), ParseBoolPipe)
    businessHoursRelation?: boolean,
  ): Promise<LocationPaginatedResponse> {
    this.logger.verbose(this.getMany.name);
    return buildPaginatedResults({
      results: await this.service.findAndCountWithMerchantIdOrPath({
        where: { merchantIdOrPath, status: 'ACTIVE' },
        relations: {
          address: addressRelation,
          businessHours: businessHoursRelation,
        },
      }),
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'), CustomerMerchantGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LocationPaginatedResponse })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiQuery({ name: 'merchantIdOrPath', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'address', required: false, type: Boolean })
  @ApiQuery({ name: 'businessHours', required: false, type: Boolean })
  @ApiOperation({
    summary: 'Get all your Locations',
    operationId: 'getLocationsMe',
  })
  async getMe(
    @Req() request: UserTypeGuardedRequest,
    @Query('actingAs') actingAs: UserTypeEnum,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('address', new DefaultValuePipe(false), ParseBoolPipe)
    addressRelation?: boolean,
    @Query('businessHours', new DefaultValuePipe(false), ParseBoolPipe)
    businessHoursRelation?: boolean,
  ): Promise<LocationPaginatedResponse> {
    this.logger.verbose(this.getMe.name);
    return buildPaginatedResults({
      results: await this.service.findAndCount({
        where: {
          merchantId: request.merchant.id,
          status: 'ACTIVE',
          moaEnabled: actingAs === UserTypeEnum.customer ? true : undefined,
        },
        relations: {
          address: addressRelation,
          businessHours: businessHoursRelation,
        },
      }),
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiQuery({ name: 'merchantIdOrPath', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: true, enum: UserTypeEnum })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MoaLocation })
  @ApiOperation({
    summary: 'Get a Location with ID',
    operationId: 'getLocation',
  })
  async getOne(@Param('id') id: string): Promise<MoaLocation> {
    this.logger.verbose(this.getOne.name);
    const translations = this.translations();
    const entity = await this.service.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(translations.locationsNotFound);
    }

    return entity;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @Patch(':id')
  @ApiOkResponse({ type: MoaLocation }) // Assuming you have a Location model similar to Category
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({
    summary: 'Update a Location',
    operationId: 'patchOneLocation',
  })
  async patchOne(
    @Req() request: any,
    @Param('id') id: string,
    @Body() body: LocationPatchBody,
  ): Promise<MoaLocation> {
    this.logger.verbose(this.patchOne.name);
    const translations = this.translations();
    const entity = await this.service.findOne({
      where: { id, merchantId: request.merchant.id },
    });

    if (!entity) {
      throw new NotFoundException(translations.locationsNotFound);
    }

    return this.service.updateOne({
      entity,
      input: body,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [MoaLocation] }) // Array of Location
  @ApiBody({ type: [LocationsPatchBody] })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiOperation({
    summary: 'Update Locations',
    operationId: 'patchManyLocations',
  })
  async patchMany(@Body() body: LocationsPatchBody[]): Promise<MoaLocation[]> {
    this.logger.verbose(this.patchMany.name);
    return await this.service.updateAll(body);
  }
}
