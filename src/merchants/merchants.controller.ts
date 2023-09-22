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
import { StripeBillingPortalCreateOutput } from './dto/stripe-portal.dto.js';
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
  @Post('me')
  @ApiBadRequestResponse({
    description: 'Merchant already exists',
    type: NestError,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Merchant for current User',
    operationId: 'postMerchantMe',
  })
  @ApiOkResponse({ description: 'Merchant created', type: Merchant })
  async postMe(@Req() request: any) {
    this.logger.verbose(this.postMe.name);
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

    return await this.service.save(merchant);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current Merchant',
    operationId: 'getMerchantMe',
  })
  @ApiQuery({ name: 'user', required: false, type: Boolean })
  @ApiQuery({ name: 'appConfig', required: false, type: Boolean })
  @ApiQuery({ name: 'locations', required: false, type: Boolean })
  @ApiQuery({ name: 'catalog', required: false, type: Boolean })
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
    @Query('catalog', new DefaultValuePipe(false), ParseBoolPipe)
    catalog?: boolean,
  ): Promise<Merchant> {
    this.logger.verbose(this.getMe.name);
    const { user } = request;
    const merchant = await this.service.findOne({
      where: { userId: user.id },
      relations: {
        appConfig,
        locations,
        catalog,
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
    operationId: 'postSquareOauthMe',
  })
  @ApiBody({ type: SquareConfirmOauthDto })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ description: 'Square Oauth confirmed' })
  async postMeSquareOauth(
    @Req() request: any,
    @Body()
    input: SquareConfirmOauthDto,
  ): Promise<void> {
    this.logger.verbose(this.postMeSquareOauth.name);
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
    operationId: 'getSquareSyncMe',
  })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  async getMeSquareSync(@Req() request: any): Promise<void> {
    this.logger.verbose(this.getMeSquareSync.name);
    return this.merchantsSquareService.sync({
      merchantId: request.merchant.id,
    });
  }

  @Post('me/stripe/checkout/')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Start Stripe checkout',
    operationId: 'postStripeCheckoutMe',
  })
  @ApiBody({ type: StripeCheckoutCreateDto })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ type: StripeCheckoutDto })
  async postMeStripeCheckout(
    @Req() request: MerchantsGuardedRequest,
    @Body() input: StripeCheckoutCreateDto,
  ): Promise<StripeCheckoutDto | null> {
    this.logger.verbose(this.postMeStripeCheckout.name);
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

  @Get('me/stripe/billing-session/')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Start create billing session url',
    operationId: 'getStripeBillingSessionMe',
  })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ type: StripeBillingPortalCreateOutput })
  @ApiQuery({ name: 'returnUrl', required: true, type: String })
  async getMeStripeBillingSession(
    @Req() request: MerchantsGuardedRequest,
    @Query('returnUrl') returnUrl: string,
  ): Promise<StripeBillingPortalCreateOutput | null> {
    this.logger.verbose(this.getMeStripeBillingSession.name);
    const url = await this.merchantsStripeService.createBillingPortalSession({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      merchantId: request.merchant.id!,
      returnUrl: returnUrl,
    });

    if (!url) {
      throw new InternalServerErrorException(
        'Failed to create checkout session',
      );
    }

    return { url };
  }
}
