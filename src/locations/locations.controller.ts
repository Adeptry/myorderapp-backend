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
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import {
  UserTypeGuard,
  UserTypeGuardedRequest,
} from 'src/guards/user-type.guard';
import {
  LocationUpdateAllDto,
  LocationUpdateDto,
} from 'src/locations/dto/location-update.input';
import { LocationPaginatedResponse } from 'src/locations/dto/locations-paginated.output';
import { Location as MoaLocation } from 'src/locations/entities/location.entity';
import { LocationsService } from 'src/locations/locations.service';
import { UserTypeEnum } from 'src/users/dto/type-user.dto';
import { NestError } from 'src/utils/error';
import { paginatedResults } from 'src/utils/paginated';

@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@ApiTags('Locations')
@Controller('v2/locations')
export class LocationsController {
  private readonly logger = new Logger(LocationsController.name);

  constructor(private readonly service: LocationsService) {}

  @ApiBearerAuth()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LocationPaginatedResponse })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({
    summary: 'Get Locations for Merchant',
    operationId: 'getLocations',
  })
  async getMerchantLocations(
    @Query('merchantId') merchantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<LocationPaginatedResponse> {
    return paginatedResults({
      results: await this.service.findAndCount({
        where: { merchantId, status: 'ACTIVE' },
        relations: ['address', 'businessHours'],
      }),
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LocationPaginatedResponse })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({
    summary: 'Get all your Locations',
    operationId: 'getMyLocations',
  })
  async getMyLocations(
    @Req() request: UserTypeGuardedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<LocationPaginatedResponse> {
    return paginatedResults({
      results: await this.service.findAndCount({
        where: { merchantId: request.merchant.id, status: 'ACTIVE' },
        relations: ['address', 'businessHours'],
      }),
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: true, enum: UserTypeEnum })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MoaLocation })
  @ApiOperation({
    summary: 'Get a Location with ID',
    operationId: 'getLocation',
  })
  async getLocation(
    @Req() request: UserTypeGuardedRequest,
    @Param('id') id: string,
  ): Promise<MoaLocation> {
    const entity = await this.service.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(`Location with id ${id} not found`);
    }

    return entity;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @Patch(':id')
  @ApiOkResponse({ type: MoaLocation }) // Assuming you have a Location model similar to Category
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({ summary: 'Update a Location', operationId: 'updateLocation' })
  async updateLocation(
    @Req() request: any,
    @Param('id') id: string,
    @Body() input: LocationUpdateDto,
  ): Promise<MoaLocation> {
    const entity = await this.service.findOne({
      where: { id, merchantId: request.merchant.id },
    });

    if (!entity) {
      throw new NotFoundException(`Location with id ${id} not found`);
    }

    return this.service.assignAndSave({
      entity,
      input,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [MoaLocation] }) // Array of Location
  @ApiBody({ type: [LocationUpdateAllDto] })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOperation({
    summary: 'Update Locations',
    operationId: 'updateLocations',
  })
  async updateLocations(
    @Req() request: any,
    @Body() input: LocationUpdateAllDto[],
  ): Promise<MoaLocation[]> {
    return await this.service.updateAll(input);
  }
}
