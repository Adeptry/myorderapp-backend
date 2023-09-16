import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CustomersService } from '../customers/customers.service.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import {
  CustomersGuard,
  CustomersGuardedRequest,
} from '../guards/customers.guard.js';
import { MerchantsGuard } from '../guards/merchants.guard.js';
import { UsersGuard } from '../guards/users.guard.js';
import { NestError } from '../utils/error.js';
import { paginatedResults } from '../utils/paginated.js';
import { AppInstallUpdateDto } from './dto/app-install-update.dto.js';
import { CustomersPaginatedResponse } from './dto/customers-paginated.output.js';
import { CustomerUpdateDto } from './dto/update-customer.dto.js';
import { AppInstallsService } from './services/app-installs.service.js';

@ApiUnauthorizedResponse({
  description: 'You need to be authenticated to access this endpoint.',
  type: NestError,
})
@ApiTags('Customers')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'customers',
  version: '2',
})
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(
    private readonly service: CustomersService,
    private readonly appInstallsService: AppInstallsService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @Post()
  @ApiBadRequestResponse({
    description: 'Merchant does not have Square access token',
    type: NestError,
  })
  @ApiBadRequestResponse({
    description: 'Customer already exists',
    type: NestError,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: Customer })
  @ApiOperation({
    summary: 'Create Customer for current User',
    operationId: 'createCustomer',
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async create(@Req() request: any, @Query('merchantId') merchantId: string) {
    return this.service.createAndSave({
      userId: request.user.id,
      merchantId: merchantId,
    });
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Customer })
  @ApiOperation({
    summary: 'Get current Customer',
    operationId: 'getCurrentCustomer',
  })
  @ApiQuery({ name: 'user', required: false, type: Boolean })
  @ApiQuery({ name: 'merchant', required: false, type: Boolean })
  @ApiQuery({ name: 'currentOrder', required: false, type: Boolean })
  @ApiQuery({ name: 'preferredLocation', required: false, type: Boolean })
  async me(
    @Req() request: CustomersGuardedRequest,
    @Query('user', new DefaultValuePipe(false), ParseBoolPipe)
    userRelation?: boolean,
    @Query('merchant', new DefaultValuePipe(false), ParseBoolPipe)
    merchantRelation?: boolean,
    @Query('currentOrder', new DefaultValuePipe(false), ParseBoolPipe)
    currentOrderRelation?: boolean,
    @Query('preferredLocation', new DefaultValuePipe(false), ParseBoolPipe)
    preferredLocationRelation?: boolean,
  ): Promise<Customer> {
    const { customer, merchant } = request;

    return await this.service.findOneOrFail({
      where: { id: customer.id, merchantId: merchant.id },
      relations: {
        user: userRelation,
        merchant: merchantRelation,
        currentOrder: currentOrderRelation,
        preferredLocation: preferredLocationRelation
          ? {
              businessHours: preferredLocationRelation,
              address: preferredLocationRelation,
            }
          : undefined,
      },
    });
  }

  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ type: Customer })
  @ApiOperation({
    summary: 'Update your Customer',
    operationId: 'updateMyCustomer',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: NestError })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiBody({ type: CustomerUpdateDto })
  async update(
    @Req() request: CustomersGuardedRequest,
    @Body() customerUpdateDto: CustomerUpdateDto,
  ) {
    const { customer, merchant } = request;

    if (!customer.id || !merchant.id) {
      throw new UnprocessableEntityException(
        "Customer or Merchant doesn't exist",
      );
    }

    return this.service.updateAndSave({
      id: customer.id,
      merchantId: merchant.id,
      customerUpdateDto,
    });
  }

  @ApiBearerAuth()
  @Get()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: CustomersPaginatedResponse })
  @ApiOperation({ summary: 'Get my Customers', operationId: 'getCustomers' })
  async get(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<CustomersPaginatedResponse> {
    return paginatedResults({
      results: await this.service.findAndCount({
        where: { merchantId: request.merchant.id },
        relations: {
          user: true,
        },
      }),
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Post('me/app-install')
  @ApiOperation({
    summary: 'Create or update Customer App Install',
    operationId: 'updateAppInstall',
  })
  @ApiBody({ type: AppInstallUpdateDto })
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
  })
  @ApiOkResponse({
    description: 'The record has been successfully updated.',
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async updateMyAppInstall(
    @Req() request: CustomersGuardedRequest,
    @Body() body: AppInstallUpdateDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Find the AppInstall entity with the provided tokenId
    let appInstall = await this.appInstallsService.findOne({
      where: {
        firebaseInstallationId: body.firebaseInstallationId,
        customerId: request.customer.id,
      },
    });

    res.status(HttpStatus.OK);

    if (!appInstall) {
      // Create a new AppInstall entity
      appInstall = this.appInstallsService.create({
        customerId: request.customer.id,
        firebaseInstallationId: body.firebaseInstallationId,
      });
      res.status(HttpStatus.CREATED);
    }

    // Update the AppInstall entity with the new FCM token
    appInstall = await this.appInstallsService.save(
      this.appInstallsService.merge(appInstall, {
        firebaseCloudMessagingToken: body.firebaseCloudMessagingToken,
      }),
    );

    return;
  }
}
