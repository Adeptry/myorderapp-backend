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
import type { MerchantsGuardedRequest } from '../guards/merchants.guard.js';
import { MerchantsGuard } from '../guards/merchants.guard.js';
import type { UsersGuardedRequest } from '../guards/users.guard.js';
import { UsersGuard } from '../guards/users.guard.js';
import { AppLogger } from '../logger/app.logger.js';
import { StripeCheckoutCreateDto } from '../merchants/dto/stripe-checkout-create.input.js';
import { SquareService } from '../square/square.service.js';
import { StripeService } from '../stripe/stripe.service.js';
import { NestError } from '../utils/error.js';
import { SquareConfirmOauthDto } from './dto/square-confirm-oauth.input.js';
import { StripeCheckoutDto } from './dto/stripe-checkout.dto.js';
import {
  StripeBillingPortalCreateInput,
  StripeBillingPortalCreateOutput,
} from './dto/stripe-portal.dto.js';
import { Merchant } from './entities/merchant.entity.js';
import { MerchantsService } from './merchants.service.js';
import { MerchantsSquareService } from './merchants.square.service.js';
import { MerchantsStripeService } from './merchants.stripe.service.js';

@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@ApiTags('Merchants')
@Controller({
  path: 'merchants',
  version: '2',
})
export class MerchantsController {
  constructor(
    protected readonly service: MerchantsService,
    protected readonly merchantsSquareService: MerchantsSquareService,
    protected readonly merchantsStripeService: MerchantsStripeService,
    protected readonly squareService: SquareService,
    protected readonly authService: AuthService,
    @Inject(StripeService)
    private readonly stripeService: StripeService,
    private readonly logger: AppLogger,
  ) {
    logger.setContext(MerchantsController.name);
  }

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
  async post(@Req() request: any) {
    this.logger.verbose(this.post.name);
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
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ type: Merchant })
  async getMe(
    @Req() request: UsersGuardedRequest,
    @Query('user', new DefaultValuePipe(false), ParseBoolPipe)
    userRelation?: boolean,
    @Query('appConfig', new DefaultValuePipe(false), ParseBoolPipe)
    appConfig?: boolean,
    @Query('locations', new DefaultValuePipe(false), ParseBoolPipe)
    locations?: boolean,
  ): Promise<Merchant> {
    this.logger.verbose(this.getMe.name);
    const { user } = request;
    const merchant = await this.service.findOne({
      where: { userId: user.id },
      relations: {
        appConfig,
        locations,
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
  @ApiBody({ type: SquareConfirmOauthDto })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ description: 'Square Oauth confirmed' })
  async postSquareOauth(
    @Req() request: any,
    @Body()
    input: SquareConfirmOauthDto,
  ): Promise<void> {
    this.logger.verbose(this.postSquareOauth.name);
    await this.merchantsSquareService.updateOauth({
      oauthAccessCode: input.oauthAccessCode,
      merchantId: request.merchant.id,
    });

    return;
  }

  @Get('me/square/sync')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync your Square Catalog',
    operationId: 'squareSync',
  })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  async squareSync(@Req() request: any): Promise<void> {
    this.logger.verbose(this.squareSync.name);
    return this.merchantsSquareService.sync({
      merchantId: request.merchant.id,
    });
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
    @Req() request: MerchantsGuardedRequest,
    @Body() input: StripeCheckoutCreateDto,
  ): Promise<StripeCheckoutDto | null> {
    this.logger.verbose(this.stripeCreateCheckoutSessionId.name);
    const checkoutSessionId =
      await this.merchantsStripeService.createCheckoutSessionId({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        merchantId: request.merchant.id!,
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
    @Req() request: MerchantsGuardedRequest,
    @Body() input: StripeBillingPortalCreateInput,
  ): Promise<StripeBillingPortalCreateOutput | null> {
    this.logger.verbose(this.stripeCreateBillingSessionUrl.name);
    const url = await this.merchantsStripeService.createBillingPortalSession({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      merchantId: request.merchant.id!,
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
