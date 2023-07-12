import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
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
import { AuthService } from 'src/auth/auth.service';
import { CustomersService } from 'src/customers/customers.service';
import { Customer } from 'src/customers/entities/customer.entity';
import { MerchantCreateInput } from 'src/merchants/dto/create-merchant.input';
import { MerchantsService } from 'src/merchants/merchants.service';
import { SquareDisableCardResponse } from 'src/square/entities/squard-disable-card.output';
import { SquareCard } from 'src/square/entities/square-card.output';
import { SquareCreateCustomerCardInput } from 'src/square/entities/square-create-card.input';
import { SquareListCardsResponse } from 'src/square/entities/square-list-cards.output';
import { SquareService } from 'src/square/square.service';
import { MoaError } from 'src/utils/error';
import { NullableType } from 'src/utils/types/nullable.type';

@ApiTags('Customers')
@Controller({
  path: 'customers',
  version: '2',
})
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(
    private readonly service: CustomersService,
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(MerchantsService)
    private readonly merchantsService: MerchantsService,
    @Inject(SquareService)
    private readonly squareService: SquareService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'input', required: true, type: MerchantCreateInput })
  @ApiOperation({ summary: 'Create Customer for current User' })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  async create(@Req() request: any, @Query('merchantId') merchantId: string) {
    const user = await this.authService.me(request.user);

    if (!user?.id) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const merchant = await this.merchantsService.findOne({
      where: { id: merchantId },
    });
    if (!merchant?.id) {
      throw new InternalServerErrorException(`Merchant does not exist`);
    }

    return this.service.createAndSave({
      userId: user.id,
      merchantId: merchant.id,
    });
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Customer })
  @ApiOperation({ summary: 'Get current Customer' })
  public async me(
    @Req() request: any,
    @Query('merchantId') merchantId: string,
  ): Promise<NullableType<Customer>> {
    const user = await this.authService.me(request.user);
    const userId = user?.id;
    if (!userId) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const entity = await this.service.findOne({
      where: { userId, merchantId },
    });

    if (!entity) {
      throw new UnauthorizedException(
        `Customer with userId ${userId} not found`,
      );
    }

    return entity;
  }

  @ApiOkResponse({ type: SquareListCardsResponse })
  @ApiBearerAuth()
  @ApiOperation({ operationId: 'listMyCards', summary: 'List my Cards' })
  @UseGuards(AuthGuard('jwt'))
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: MoaError,
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @Get('me/square/cards')
  async listMyCards(
    @Req() request: any,
    @Query('merchantId') merchantId: string,
    @Query('cursor') cursor?: string,
  ): Promise<SquareListCardsResponse> {
    const user = await this.authService.me(request.user);
    const userId = user?.id;
    if (!userId) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const entity = await this.service.findOne({
      where: { userId, merchantId },
    });

    const customerId = entity?.squareId;
    if (!customerId) {
      throw new UnauthorizedException(
        `Square customer with userId ${userId} not found`,
      );
    }

    const merchant = await this.merchantsService.findOne({
      where: { id: merchantId },
    });
    const squareAccessToken = merchant?.squareAccessToken;
    if (!squareAccessToken) {
      throw new BadRequestException(
        `Merchant with id ${squareAccessToken} not found`,
      );
    }

    try {
      const listCards = await this.squareService.listCards({
        accessToken: squareAccessToken,
        customerId,
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
  @UseGuards(AuthGuard('jwt'))
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
    @Query('merchantId') merchantId: string,
  ) {
    const user = await this.authService.me(request.user);
    const userId = user?.id;
    if (!userId) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const entity = await this.service.findOne({
      where: { userId },
    });

    const customerSquareId = entity?.squareId;
    if (!customerSquareId) {
      throw new UnauthorizedException(
        `Square customer with userId ${userId} not found`,
      );
    }

    const merchant = await this.merchantsService.findOne({
      where: { id: merchantId },
    });
    const squareAccessToken = merchant?.squareAccessToken;
    if (!squareAccessToken) {
      throw new BadRequestException(
        `Merchant with id ${squareAccessToken} not found`,
      );
    }

    try {
      createCardDto.card.customerId = customerSquareId;
      const response = await this.squareService.createCard({
        accessToken: squareAccessToken,
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
  @UseGuards(AuthGuard('jwt'))
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
    @Query('merchantId') merchantId: string,
  ): Promise<SquareDisableCardResponse> {
    const user = await this.authService.me(request.user);
    const userId = user?.id;
    if (!userId) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const entity = await this.service.findOne({
      where: { userId },
    });

    const squareId = entity?.squareId;
    if (!squareId) {
      throw new UnauthorizedException(
        `Square customer with userId ${userId} not found`,
      );
    }

    const merchant = await this.merchantsService.findOne({
      where: { id: merchantId },
    });
    const squareAccessToken = merchant?.squareAccessToken;
    if (!squareAccessToken) {
      throw new BadRequestException(
        `Merchant with id ${squareAccessToken} not found`,
      );
    }

    try {
      const response = await this.squareService.disableCard({
        accessToken: squareAccessToken,
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
