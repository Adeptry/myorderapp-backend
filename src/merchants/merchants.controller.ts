import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  ParseBoolPipe,
  Post,
  Query,
  Req,
  SerializeOptions,
  UnauthorizedException,
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
import { AuthService } from '../auth/auth.service.js';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import { MerchantsGuard } from '../guards/merchants.guard.js';
import { UsersGuard } from '../guards/users.guard.js';
import { StripeCheckoutCreateDto } from '../merchants/dto/stripe-checkout-create.input.js';
import { SquareService } from '../square/square.service.js';
import { StripeService } from '../stripe/stripe.service.js';
import { NestError } from '../utils/error.js';
import { StripeCheckoutDto } from './dto/stripe-checkout.dto.js';
import {
  StripeBillingPortalCreateInput,
  StripeBillingPortalCreateOutput,
} from './dto/stripe-portal.dto.js';
import { Merchant } from './entities/merchant.entity.js';
import { MerchantsService } from './merchants.service.js';

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
    @Inject(StripeService)
    private readonly stripeService: StripeService,
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

    const merchant = this.service.create({
      userId: request.user.id,
    });
    const stripeCustomer = await this.stripeService.createCustomer({
      email: request.user.email ?? '',
      phone: request.user.phoneNumber ?? '',
      name: request.user.firstName ?? '',
    });
    merchant.stripeId = stripeCustomer?.id;

    await this.service.save(merchant);
    return;
  }

  @Get('me')
  @SerializeOptions({
    groups: ['me'],
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current Merchant',
    operationId: 'getCurrentMerchant',
  })
  @ApiQuery({ name: 'user', required: false, type: Boolean })
  @ApiQuery({ name: 'appConfig', required: false, type: Boolean })
  @ApiQuery({ name: 'locations', required: false, type: Boolean })
  @ApiQuery({ name: 'androidZipFile', required: false, type: Boolean })
  @ApiQuery({ name: 'iosZipFile', required: false, type: Boolean })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ type: Merchant })
  async me(
    @Req() request,
    @Query('user', new DefaultValuePipe(false), ParseBoolPipe)
    userRelation?: boolean,
    @Query('appConfig', new DefaultValuePipe(false), ParseBoolPipe)
    appConfig?: boolean,
    @Query('locations', new DefaultValuePipe(false), ParseBoolPipe)
    locations?: boolean,
    @Query('androidZipFile', new DefaultValuePipe(false), ParseBoolPipe)
    androidZipFile?: boolean,
    @Query('iosZipFile', new DefaultValuePipe(false), ParseBoolPipe)
    iosZipFile?: boolean,
  ): Promise<Merchant> {
    const { user } = request;
    const merchant = await this.service.findOne({
      where: { userId: user.id },
      relations: {
        appConfig,
        locations,
        androidZipFile,
        iosZipFile,
      },
    });

    if (!merchant) {
      throw new UnauthorizedException(
        `Merchant with userId ${user.id} does not exist`,
      );
    }

    if (userRelation) {
      merchant.user = user;
    }

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
      merchantId: request.merchant.id,
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
