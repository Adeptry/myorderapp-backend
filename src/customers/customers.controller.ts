import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
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
import { UsersGuard } from 'src/guards/users.guard';
import { MerchantCreateInput } from 'src/merchants/dto/create-merchant.input';
import { MerchantsService } from 'src/merchants/merchants.service';
import { SquareDisableCardResponse } from 'src/square/entities/squard-disable-card.output';
import { SquareCard } from 'src/square/entities/square-card.output';
import { SquareCreateCustomerCardInput } from 'src/square/entities/square-create-card.input';
import { SquareListCardsResponse } from 'src/square/entities/square-list-cards.output';
import { SquareService } from 'src/square/square.service';
import { MoaError } from 'src/utils/error';

@ApiTags('Customers')
@Controller({
  path: 'customers',
  version: '2',
})
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(
    private readonly service: CustomersService,
    private readonly merchantsService: MerchantsService,
    private readonly squareService: SquareService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'input', required: true, type: MerchantCreateInput })
  @ApiOperation({ summary: 'Create Customer for current User' })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  async create(@Req() request: any, @Query('merchantId') merchantId: string) {
    const merchant = await this.merchantsService.findOne({
      where: { id: merchantId },
    });
    if (!merchant?.id) {
      throw new InternalServerErrorException(`Merchant does not exist`);
    }

    return this.service.createAndSave({
      user: request.user,
      merchant,
    });
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Customer })
  @ApiOperation({ summary: 'Get current Customer' })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  public me(@Req() request: any): Promise<Customer> {
    return request.customer;
  }

  @ApiOkResponse({ type: SquareListCardsResponse })
  @ApiBearerAuth()
  @ApiOperation({ operationId: 'listMyCards', summary: 'List my Cards' })
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: MoaError,
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
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
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `There was an error listing cards. ${error}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiCreatedResponse({ type: SquareCard })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: MoaError,
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
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
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `There was an error creating the card. ${error}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOkResponse({ type: SquareDisableCardResponse })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: MoaError,
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
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
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `There was an error creating the card. ${error}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
