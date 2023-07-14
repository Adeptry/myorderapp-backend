import {
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
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { StripeCheckoutCreateInput } from 'src/merchants/dto/stripe-checkout-create.input';
import { SquareService } from 'src/square/square.service';
import { NestError } from 'src/utils/error';
import { NullableType } from 'src/utils/types/nullable.type';
import { MerchantsGuard } from '../guards/merchants.guard';
import { StripeCheckoutDto } from './dto/stripe-checkout.dto';
import { Merchant } from './entities/merchant.entity';
import { MerchantsService } from './merchants.service';

@ApiTags('Merchant')
@Controller({
  path: 'merchant',
  version: '2',
})
export class MerchantsController {
  private readonly logger = new Logger(MerchantsController.name);

  constructor(
    protected readonly service: MerchantsService,
    @Inject(SquareService)
    protected readonly squareService: SquareService,
  ) {}

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
  async squareConfirmOauth(
    @Req() request: any,
    @Query('oauthAccessCode') oauthAccessCode: string,
  ): Promise<Merchant | null> {
    return this.service.squareConfirmOauth({
      oauthAccessCode,
      merchant: request.merchant,
    });
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
  @ApiBody({ type: StripeCheckoutCreateInput })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ type: StripeCheckoutDto })
  async stripeCreateCheckoutSessionId(
    @Req() request,
    @Body() input: StripeCheckoutCreateInput,
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
