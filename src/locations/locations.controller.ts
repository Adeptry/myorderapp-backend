import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  Request,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { CustomersService } from 'src/customers/customers.service';
import {
  LocationUpdateAllInput,
  LocationUpdateInput,
} from 'src/locations/dto/location-update.input';
import { MoaLocationPaginatedResponse } from 'src/locations/dto/locations-paginated.output';
import { Location as MoaLocation } from 'src/locations/entities/location.entity';
import { LocationsService } from 'src/locations/locations.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { Roles } from 'src/roles/roles.decorator';
import { RoleNameEnum } from 'src/roles/roles.enum';
import { RolesGuard } from 'src/roles/roles.guard';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { paginated } from 'src/utils/paginated';

@ApiTags('Locations')
@Controller('v2/locations')
export class LocationsController {
  private readonly logger = new Logger(LocationsController.name);

  constructor(
    private readonly service: LocationsService,
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(MerchantsService)
    private readonly merchantsService: MerchantsService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
  ) {}

  @ApiBearerAuth()
  @Get()
  @Roles(RoleNameEnum[RoleNameEnum.user])
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MoaLocationPaginatedResponse })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'as', required: true, enum: UserTypeEnum })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiOperation({ summary: 'Get all your locations' })
  async getLocations(
    @Request() request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('as') userType: UserTypeEnum,
    @Query('merchantId') merchantId?: string,
  ): Promise<MoaLocationPaginatedResponse> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    switch (userType) {
      case UserTypeEnum.merchant:
        const merchant = await this.merchantsService.findOne({
          where: { userId: user.id },
        });

        if (!merchant?.id) {
          throw new UnauthorizedException(
            `Merchant with userId ${user.id} not found`,
          );
        }

        const merchantFindAndCount = await this.service.findAndCount({
          where: { merchantId: merchant.id, status: 'ACTIVE' },
        });

        return paginated({
          data: merchantFindAndCount[0],
          count: merchantFindAndCount[1],
          pagination: { page, limit },
        });
      case UserTypeEnum.customer:
        if (!merchantId) {
          throw new BadRequestException(`merchantId is required`);
        }

        const customer = await this.customersService.findOne({
          where: { userId: user.id, merchantId },
        });

        if (!customer) {
          throw new UnauthorizedException(`Customer not found`);
        }

        const customersMerchant = await this.customersService.loadOneMerchant(
          customer,
        );

        if (!customersMerchant?.id || customersMerchant?.id !== merchantId) {
          throw new UnauthorizedException(
            `Customer with merchant id ${merchantId} not found`,
          );
        }

        const customerFindAndCount = await this.service.findAndCount({
          where: {
            merchantId: customersMerchant.id,
            status: 'ACTIVE',
            moaEnabled: true,
          },
        });

        return paginated({
          data: customerFindAndCount[0],
          count: customerFindAndCount[1],
          pagination: { page, limit },
        });
    }
  }

  @ApiBearerAuth()
  @Get(':id')
  @Roles(RoleNameEnum.user)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MoaLocation })
  @ApiQuery({ name: 'as', required: true, enum: UserTypeEnum })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiOperation({ summary: 'Get a Location with ID' })
  async getLocation(
    @Request() request,
    @Param('id') id: string,
    @Query('as') userType: UserTypeEnum,
    @Query('merchantId') merchantId?: string,
  ): Promise<MoaLocation> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    switch (userType) {
      case UserTypeEnum.merchant:
        const merchant = await this.merchantsService.findOne({
          where: { userId: user.id },
        });

        if (!merchant?.id) {
          throw new UnauthorizedException(
            `Merchant with userId ${user.id} not found`,
          );
        }

        const merchantLocation = await this.service.findOne({
          where: { id, merchantId: merchant.id },
        });

        if (!merchantLocation) {
          throw new NotFoundException(`Location with id ${id} not found`);
        }

        return merchantLocation;

      case UserTypeEnum.customer:
        if (!merchantId) {
          throw new BadRequestException(`merchantId is required`);
        }

        const customer = await this.customersService.findOne({
          where: { userId: user.id, merchantId },
        });

        if (!customer) {
          throw new UnauthorizedException(`Customer not found`);
        }

        const customersMerchant = await this.customersService.loadOneMerchant(
          customer,
        );

        if (!customersMerchant?.id || customersMerchant?.id !== merchantId) {
          throw new UnauthorizedException(
            `Customer with merchant id ${merchantId} not found`,
          );
        }

        const customerLocation = await this.service.findOne({
          where: { id, merchantId },
        });

        if (!customerLocation) {
          throw new NotFoundException(`Location with id ${id} not found`);
        }

        return customerLocation;
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @ApiOkResponse({ type: MoaLocation }) // Assuming you have a Location model similar to Category
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({ summary: 'Update a Location' })
  async updateLocation(
    @Req() request: any,
    @Param('id') id: string,
    @Body() input: LocationUpdateInput,
  ): Promise<MoaLocation> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    this.logger.verbose(
      `Updating Location ${id} for user ${user.id} with ${Object.keys(input)}`,
    );
    return this.service.assignAndSave({
      id,
      input,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [MoaLocation] }) // Array of Location
  @ApiBody({ type: [LocationUpdateAllInput] })
  @ApiOperation({ summary: 'Update multiple Locations' })
  async updateMultipleLocations(
    @Req() request: any,
    @Body() input: LocationUpdateAllInput[],
  ): Promise<MoaLocation[]> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    this.logger.verbose(
      `Updating Locations for user ${user.id} with ${Object.keys(input)}`,
    );

    return await this.service.updateAll(input);
  }
}
