import {
  Body,
  ConflictException,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
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
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiKeyAuthGuard } from '../authentication/apikey-auth.guard.js';
import type { AuthenticatedRequest } from '../authentication/authentication.guard.js';
import { AuthenticationGuard } from '../authentication/authentication.guard.js';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { StripeCheckoutCreateDto } from '../merchants/dto/stripe-checkout-create.input.js';
import { StripeService } from '../stripe/stripe.service.js';
import { ErrorResponse } from '../utils/error-response.js';
import { SquareConfirmOauthDto } from './dto/square-confirm-oauth.input.js';
import { StripeCheckoutDto } from './dto/stripe-checkout.dto.js';
import { StripeBillingPortalCreateOutput } from './dto/stripe-portal.dto.js';
import { Merchant } from './entities/merchant.entity.js';
import type { MerchantsGuardedRequest } from './merchants.guard.js';
import { MerchantsGuard } from './merchants.guard.js';
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
  private readonly logger = new Logger(MerchantsController.name);

  constructor(
    private readonly service: MerchantsService,
    private readonly i18n: I18nService<I18nTranslations>,

    private readonly merchantsSquareService: MerchantsSquareService,
    private readonly merchantsStripeService: MerchantsStripeService,
    private readonly stripeService: StripeService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  currentTranslations() {
    return this.i18n.t('merchants', {
      lang: I18nContext.current()?.lang,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard)
  @Post('me')
  @ApiBadRequestResponse({
    description: 'Merchant already exists',
    type: ErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Merchant for current User',
    operationId: 'postMerchantMe',
  })
  @ApiOkResponse({ description: 'Merchant created', type: Merchant })
  @ApiConflictResponse({
    description: 'Merchant already exists',
    type: ErrorResponse,
  })
  async postMe(@Req() request: any) {
    this.logger.verbose(this.postMe.name);
    const translations = this.currentTranslations();
    if (
      await this.service.findOne({
        where: { userId: request.user.id },
      })
    ) {
      throw new ConflictException(translations.alreadyExists);
    }

    const merchant = this.service.create({
      userId: request.user.id,
    });
    const stripeCustomer = await this.stripeService.responseOrThrow((stripe) =>
      stripe.customers.create({
        email: request.user.email ?? '',
        phone: request.user.phoneNumber ?? '',
        name: request.user.firstName ?? '',
      }),
    );

    merchant.stripeId = stripeCustomer?.id;

    return await this.service.save(merchant);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard)
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
    type: ErrorResponse,
  })
  @ApiOkResponse({ type: Merchant })
  async getMe(
    @Req() request: AuthenticatedRequest,
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
    const translations = this.currentTranslations();
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
      throw new UnauthorizedException(translations.doesNotExist);
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
    type: ErrorResponse,
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
    type: ErrorResponse,
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
    type: ErrorResponse,
  })
  @ApiOkResponse({ type: StripeCheckoutDto })
  async postMeStripeCheckout(
    @Req() request: MerchantsGuardedRequest,
    @Body() body: StripeCheckoutCreateDto,
  ): Promise<StripeCheckoutDto | null> {
    this.logger.verbose(this.postMeStripeCheckout.name);
    const checkoutSessionId =
      await this.merchantsStripeService.createCheckoutSessionId({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        merchantId: request.merchant.id!,
        ...body,
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
    type: ErrorResponse,
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
