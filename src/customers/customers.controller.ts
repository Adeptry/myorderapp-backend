import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
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
import type { Response } from 'express';
import { CustomersService } from '../customers/customers.service.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import type { CustomersGuardedRequest } from '../guards/customers.guard.js';
import { CustomersGuard } from '../guards/customers.guard.js';
import { MerchantsGuard } from '../guards/merchants.guard.js';
import type { UsersGuardedRequest } from '../guards/users.guard.js';
import { UsersGuard } from '../guards/users.guard.js';
import { AppLogger } from '../logger/app.logger.js';
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
  constructor(
    private readonly service: CustomersService,
    private readonly appInstallsService: AppInstallsService,
    private readonly logger: AppLogger,
  ) {
    logger.setContext(CustomersController.name);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @Post('me')
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
    operationId: 'postCustomerMe',
  })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  async post(
    @Req() request: UsersGuardedRequest,
    @Query('merchantIdOrPath') merchantIdOrPath: string,
  ) {
    this.logger.verbose(this.post.name);

    return this.service.createOne({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      userId: request.user.id!,
      merchantIdOrPath: merchantIdOrPath,
    });
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Customer })
  @ApiOperation({
    summary: 'Get current Customer',
    operationId: 'getCustomerMe',
  })
  @ApiQuery({ name: 'user', required: false, type: Boolean })
  @ApiQuery({ name: 'merchant', required: false, type: Boolean })
  @ApiQuery({ name: 'currentOrder', required: false, type: Boolean })
  @ApiQuery({ name: 'preferredLocation', required: false, type: Boolean })
  async getMe(
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
    this.logger.verbose(this.getMe.name);
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
    operationId: 'patchCustomerMe',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: NestError })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiBody({ type: CustomerUpdateDto })
  async patchMe(
    @Req() request: CustomersGuardedRequest,
    @Body() customerUpdateDto: CustomerUpdateDto,
  ) {
    this.logger.verbose(this.patchMe.name);
    const { customer, merchant } = request;

    if (!customer.id || !merchant.id) {
      throw new UnprocessableEntityException(
        "Customer or Merchant doesn't exist",
      );
    }

    return this.service.updateOne({
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
  @ApiOperation({
    summary: 'Get my Customers',
    operationId: 'getManyCustomers',
  })
  async getMany(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<CustomersPaginatedResponse> {
    this.logger.verbose(this.getMany.name);
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
    operationId: 'updateAppInstallMe',
  })
  @ApiBody({ type: AppInstallUpdateDto })
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
  })
  @ApiOkResponse({
    description: 'The record has been successfully updated.',
  })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  async updateMyAppInstall(
    @Req() request: CustomersGuardedRequest,
    @Body() body: AppInstallUpdateDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.verbose(this.updateMyAppInstall.name);

    const { customer } = request;

    // Find the AppInstall entity with the provided tokenId
    let appInstall = await this.appInstallsService.findOne({
      where: {
        firebaseInstallationId: body.firebaseInstallationId,
        customerId: customer.id,
      },
    });

    res.status(HttpStatus.OK);

    if (!appInstall) {
      // Create a new AppInstall entity
      appInstall = this.appInstallsService.create({
        customerId: customer.id,
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
