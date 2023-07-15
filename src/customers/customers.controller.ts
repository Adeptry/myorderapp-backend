import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadGatewayResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CustomersService } from 'src/customers/customers.service';
import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersGuard } from 'src/guards/customers.guard';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import { UsersGuard } from 'src/guards/users.guard';
import { MerchantCreateDto } from 'src/merchants/dto/create-merchant.input';
import { SquareService } from 'src/square/square.service';
import { NestError } from 'src/utils/error';
import { paginatedResults } from 'src/utils/paginated';
import { CustomersPaginatedResponse } from './dto/customers-paginated.output';

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
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @Post()
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiInternalServerErrorResponse({
    description: 'Merchant does not have Square access token',
    type: NestError,
  })
  @ApiBadGatewayResponse({
    description: 'Customer already exists',
    type: NestError,
  })
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'input', required: true, type: MerchantCreateDto })
  @ApiOperation({
    summary: 'Create Customer for current User',
    operationId: 'createCustomer',
  })
  async create(@Req() request: any) {
    if (
      await this.service.findOne({
        where: { userId: request.user.id, merchantId: request.merchant.id },
      })
    ) {
      throw new BadRequestException('Customer already exists');
    }

    if (!request.merchant?.squareAccessToken) {
      throw new InternalServerErrorException(
        `Merchant does not have Square access token`,
      );
    }

    const entity = await this.service.save(
      this.service.create({
        merchantId: request.merchant.id,
        userId: request.user.id,
      }),
    );

    const response = await this.squareService.createCustomer({
      accessToken: request.merchant.squareAccessToken,
      request: {
        emailAddress: request.user.email ?? undefined,
        givenName: request.user.firstName ?? undefined,
        familyName: request.user.lastName ?? undefined,
        idempotencyKey: entity.id,
      },
    });
    if (!response.result.customer?.id) {
      throw new InternalServerErrorException(
        `Failed to create Square customer`,
      );
    }

    entity.squareId = response.result.customer?.id;
    return await this.service.save(entity);
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
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
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
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
}
