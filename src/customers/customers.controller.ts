import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CustomersService } from 'src/customers/customers.service';
import { Customer } from 'src/customers/entities/customer.entity';
import {
  CustomersGuard,
  CustomersGuardedRequest,
} from 'src/guards/customers.guard';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import { UsersGuard } from 'src/guards/users.guard';
import { MerchantsService } from 'src/merchants/merchants.service';
import { SquareService } from 'src/square/square.service';
import { NestError } from 'src/utils/error';
import { paginatedResults } from 'src/utils/paginated';
import { AppInstallUpdateDto } from './dto/app-install-update.dto';
import { CustomersPaginatedResponse } from './dto/customers-paginated.output';
import { AppInstallsService } from './services/app-installs.service';

@ApiUnauthorizedResponse({
  description: 'You need to be authenticated to access this endpoint.',
  type: NestError,
})
@ApiTags('Customers')
@Controller({
  path: 'customers',
  version: '2',
})
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(
    private readonly service: CustomersService,
    private readonly squareService: SquareService,
    private readonly merchantsService: MerchantsService,
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Customer for current User',
    operationId: 'createCustomer',
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async create(@Req() request: any, @Query('merchantId') merchantId: string) {
    if (
      await this.service.findOne({
        where: { userId: request.user.id, merchantId },
      })
    ) {
      throw new BadRequestException('Customer already exists');
    }

    const merchant = await this.merchantsService.findOne({
      where: { id: merchantId },
    });
    if (!merchant) {
      throw new NotFoundException(`Merchant ${merchantId} not found`);
    }

    if (!merchant?.squareAccessToken) {
      throw new BadRequestException(
        `Merchant does not have Square access token`,
      );
    }

    const customer = await this.service.save(
      this.service.create({
        merchantId: merchant.id,
        userId: request.user.id,
      }),
    );

    const response = await this.squareService.createCustomer({
      accessToken: merchant.squareAccessToken,
      request: {
        emailAddress: request.user.email ?? undefined,
        givenName: request.user.firstName ?? undefined,
        familyName: request.user.lastName ?? undefined,
        idempotencyKey: customer.id,
      },
    });

    if (!response.result.customer?.id) {
      throw new InternalServerErrorException(
        `Failed to create Square customer`,
      );
    }

    customer.squareId = response.result.customer?.id;

    return await this.service.save(customer);
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Customer })
  @ApiOperation({
    summary: 'Get current Customer',
    operationId: 'getMyCustomer',
  })
  public me(@Req() request: any): Promise<Customer> {
    return request.customer;
  }

  @ApiBearerAuth()
  @Get()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: CustomersPaginatedResponse })
  @ApiOperation({ summary: 'Get my Customers', operationId: 'getMyCustomers' })
  async get(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<CustomersPaginatedResponse> {
    return paginatedResults({
      results: await this.service.findAndCount({
        where: { merchantId: request.merchant.id },
      }),
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Post('me/app-install')
  @ApiOperation({
    summary: 'Create or update Customer App Install',
    operationId: 'updateMyAppInstall',
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
