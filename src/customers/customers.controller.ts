import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
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
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { nanoid } from 'nanoid';
import { CustomersService } from 'src/customers/customers.service';
import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersGuard } from 'src/guards/customers.guard';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import { UsersGuard } from 'src/guards/users.guard';
import { MerchantCreateInput } from 'src/merchants/dto/create-merchant.input';
import { SquareDisableCardResponse } from 'src/square/entities/squard-disable-card.output';
import { SquareCard } from 'src/square/entities/square-card.output';
import { SquareCreateCustomerCardInput } from 'src/square/entities/square-create-card.input';
import { SquareListCardsResponse } from 'src/square/entities/square-list-cards.output';
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
  @ApiQuery({ name: 'input', required: true, type: MerchantCreateInput })
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

    const result = await this.squareService.createCustomer({
      accessToken: request.merchant.squareAccessToken,
      request: {
        emailAddress: request.user.email ?? undefined,
        givenName: request.user.firstName ?? undefined,
        familyName: request.user.lastName ?? undefined,
        idempotencyKey: entity.id,
      },
    });
    if (!result?.id) {
      throw new InternalServerErrorException(
        `Failed to create Square customer`,
      );
    }

    entity.squareId = result.id;
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

  @ApiOkResponse({ type: SquareListCardsResponse })
  @ApiBearerAuth()
  @ApiOperation({ operationId: 'listMyCards', summary: 'List my Cards' })
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiInternalServerErrorResponse({
    description: 'There was an error listing the cards.',
    type: NestError,
  })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @Get('me/square/cards')
  async listMyCards(
    @Req() request: any,
    @Query('cursor') cursor?: string,
  ): Promise<SquareListCardsResponse> {
    try {
      const listCards = await this.squareService.listCards({
        accessToken: request.merchant.squareAccessToken,
        customerId: request.customer.squareId,
        cursor,
      });
      return listCards.result as SquareListCardsResponse;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  @ApiCreatedResponse({ type: SquareCard })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOperation({ operationId: 'createMyCard', summary: 'Create my Card' })
  @ApiBody({
    type: SquareCreateCustomerCardInput,
    examples: {
      success: {
        value: {
          idempotencyKey: nanoid(),
          sourceId: 'cnon:card-nonce-ok',
          card: {
            billingAddress: {
              postalCode: '94103',
            },
          },
        },
      },
    },
  })
  @Post('me/square/cards')
  async createMyCard(
    @Body() createCardDto: SquareCreateCustomerCardInput,
    @Req() request: any,
  ) {
    try {
      createCardDto.card.customerId = request.customer.squareId;
      const response = await this.squareService.createCard({
        accessToken: request.merchant.squareAccessToken,
        body: createCardDto,
      });
      return response.result.card;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  @ApiOkResponse({ type: SquareDisableCardResponse })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiInternalServerErrorResponse({
    description: 'There was an error disabling the card.',
    type: NestError,
  })
  @ApiOperation({ operationId: 'disableMyCard', summary: 'Disable my Card' })
  @ApiParam({ name: 'id', required: true, type: String })
  @Delete('me/square/cards/:id')
  async disableMyCard(
    @Req() request: any,
    @Param('id') cardId: string,
  ): Promise<SquareDisableCardResponse> {
    try {
      const response = await this.squareService.disableCard({
        accessToken: request.merchant.squareAccessToken,
        cardId,
      });
      return response.result as SquareDisableCardResponse;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}
