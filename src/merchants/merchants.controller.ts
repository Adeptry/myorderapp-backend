import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Post,
  Query,
  Req,
  Request,
  SerializeOptions,
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
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import { UsersGuard } from 'src/guards/users.guard';
import { StripeCheckoutCreateDto } from 'src/merchants/dto/stripe-checkout-create.input';
import { SquareService } from 'src/square/square.service';
import { NestError } from 'src/utils/error';
import { NullableType } from 'src/utils/types/nullable.type';
import { StripeCheckoutDto } from './dto/stripe-checkout.dto';
import {
  StripeBillingPortalCreateInput,
  StripeBillingPortalCreateOutput,
} from './dto/stripe-portal.dto';
import { Merchant } from './entities/merchant.entity';
import { MerchantsService } from './merchants.service';

@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@ApiTags('Merchants')
@Controller({
  path: 'merchants',
  version: '2',
})
export class MerchantsController {
  private readonly logger = new Logger(MerchantsController.name);

  constructor(
    protected readonly service: MerchantsService,
    protected readonly squareService: SquareService,
    protected readonly authService: AuthService,
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
  @SerializeOptions({
    groups: ['me'],
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current Merchant',
    operationId: 'getCurrentMerchant',
  })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ type: Merchant })
  async me(@Req() request): Promise<Merchant> {
    const { merchant } = request;
    merchant.user = await this.authService.me(request.user);
    return merchant;
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
    operationId: 'createStripeCheckout',
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

  @Post('me/stripe/billing-session/create')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Start create billing session url',
    operationId: 'createStripeBillingSessionUrl',
  })
  @ApiBody({ type: StripeBillingPortalCreateInput })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ type: StripeBillingPortalCreateOutput })
  async stripeCreateBillingSessionUrl(
    @Req() request,
    @Body() input: StripeBillingPortalCreateInput,
  ): Promise<StripeBillingPortalCreateOutput | null> {
    const url = await this.service.stripeCreateBillingPortalSession({
      merchant: request.merchant,
      ...input,
    });

    if (!url) {
      throw new InternalServerErrorException(
        'Failed to create checkout session',
      );
    }

    return { url };
  }
}
