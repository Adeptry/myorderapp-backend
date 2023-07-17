import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  Post,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersGuard } from 'src/guards/users.guard';
import { StripeCheckoutCreateDto } from 'src/merchants/dto/stripe-checkout-create.input';
import { SquareService } from 'src/square/square.service';
import { NestError } from 'src/utils/error';
import { NullableType } from 'src/utils/types/nullable.type';
import { MerchantsGuard } from '../guards/merchants.guard';
import { StripeCheckoutDto } from './dto/stripe-checkout.dto';
import { Merchant } from './entities/merchant.entity';
import { MerchantsService } from './merchants.service';

@ApiTags('Merchant')
@Controller({
  path: 'merchants',
  version: '2',
})
export class MerchantsController {
  private readonly logger = new Logger(MerchantsController.name);

  constructor(
    protected readonly service: MerchantsService,
    @Inject(SquareService)
    protected readonly squareService: SquareService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @Post()
  @ApiBadRequestResponse({
    description: 'Merchant already exists',
    type: NestError,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Merchant for current User',
    operationId: 'createMerchant',
  })
  @ApiOkResponse({ description: 'Merchant created' })
  async create(@Req() request: any) {
    if (
      await this.service.findOne({
        where: { userId: request.user.id },
      })
    ) {
      throw new BadRequestException('Merchant already exists');
    }
    await this.service.save(
      this.service.create({
        userId: request.user.id,
      }),
    );
    return;
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current Merchant',
    operationId: 'getMyMerchant',
  })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ type: Merchant })
  public async me(@Req() request: any): Promise<Merchant> {
    console.log(
      this.squareService.oauthUrl({
        scope: [
          'MERCHANT_PROFILE_READ',
          'CUSTOMERS_WRITE',
          'CUSTOMERS_READ',
          'ORDERS_WRITE',
          'ORDERS_READ',
          'PAYMENTS_READ',
          'PAYMENTS_WRITE',
          'PAYMENTS_WRITE_ADDITIONAL_RECIPIENTS',
          'ITEMS_WRITE',
          'ITEMS_READ',
        ],
        state: request.merchant.id,
      }),
    );
    return await request.merchant;
  }

  @Post('me/square/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm Square Oauth',
    operationId: 'confirmSquareOauth',
  })
  @ApiQuery({ name: 'oauthAccessCode', required: true, type: String })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ description: 'Square Oauth confirmed' })
  async squareConfirmOauth(
    @Req() request: any,
    @Query('oauthAccessCode') oauthAccessCode: string,
  ): Promise<void> {
    await this.service.squareConfirmOauth({
      oauthAccessCode,
      merchant: request.merchant,
    });
    return;
  }

  @Get('me/square/catalog/sync')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync your Square Catalog',
    operationId: 'syncSquareCatalog',
  })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  async squareCatalogSync(@Req() request: any): Promise<void> {
    return this.service.squareCatalogSync({
      merchant: request.merchant,
    });
  }

  @Get('me/square/locations/sync')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync your Square Locations',
    operationId: 'syncSquareLocations',
  })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  async squareLocationsSync(@Req() request: any): Promise<void> {
    await this.service.squareLocationsSync({
      merchant: request.merchant,
    });
    return;
  }

  @Post('me/stripe/checkout/create')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Start Stripe checkout',
    operationId: 'startStripeCheckout',
  })
  @ApiBody({ type: StripeCheckoutCreateDto })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ type: StripeCheckoutDto })
  async stripeCreateCheckoutSessionId(
    @Req() request,
    @Body() input: StripeCheckoutCreateDto,
  ): Promise<StripeCheckoutDto | null> {
    const checkoutSessionId = await this.service.stripeCreateCheckoutSessionId({
      merchant: request.merchant,
      ...input,
    });

    if (!checkoutSessionId) {
      throw new InternalServerErrorException(
        'Failed to create checkout session',
      );
    }

    return { checkoutSessionId };
  }

  @Post('me/stripe/checkout/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm Square checkout',
    operationId: 'confirmStripeCheckout',
  })
  @ApiBody({ type: StripeCheckoutDto })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ type: Merchant })
  async stripeConfirmCheckoutSessionId(
    @Request() request,
    @Body()
    dto: StripeCheckoutDto,
  ): Promise<NullableType<Merchant>> {
    return this.service.stripeConfirmCheckoutSessionId({
      checkoutSessionId: dto.checkoutSessionId,
      merchant: request.merchant,
    });
  }
}
