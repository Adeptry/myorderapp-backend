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
  NotFoundException,
  Param,
  ParseBoolPipe,
  Post,
  Query,
  Req,
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
import { NestStripeService } from 'nest-stripe2';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiKeyAuthGuard } from '../../../authentication/apikey-auth.guard.js';
import type { AuthenticatedRequest } from '../../../authentication/authentication.guard.js';
import { AuthenticationGuard } from '../../../authentication/authentication.guard.js';
import { I18nTranslations } from '../../../i18n/i18n.generated.js';
import { ErrorResponse } from '../../../utils/error-response.js';
import { StripePostCheckoutBody } from '../../dto/merchants/square-post-checkout-body.dto.js';
import { SquarePostOauthBody } from '../../dto/merchants/square-post-oauth-body.dto.js';
import { StripeBillingSessionResponse } from '../../dto/merchants/stripe-billing-session-response.dto.js';
import { StripePostCheckoutResponse } from '../../dto/merchants/stripe-post-checkout-response.dto.js';
import { MerchantEntity } from '../../entities/merchants/merchant.entity.js';
import type { MerchantsGuardedRequest } from '../../guards/merchants.guard.js';
import { MerchantsGuard } from '../../guards/merchants.guard.js';
import { MerchantsService } from '../../services/merchants/merchants.service.js';
import { MerchantsSquareService } from '../../services/merchants/merchants.square.service.js';
import { MerchantsStripeService } from '../../services/merchants/merchants.stripe.service.js';

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
    private readonly stripeService: NestStripeService,
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
  @ApiOkResponse({ description: 'Merchant created', type: MerchantEntity })
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
    const stripeCustomer = await this.stripeService.retryOrThrow((stripe) =>
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
  @ApiOkResponse({ type: MerchantEntity })
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
  ): Promise<MerchantEntity> {
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
      throw new NotFoundException(translations.doesNotExist);
    }

    if (userRelation) {
      merchant.user = user;
    }

    return merchant;
  }

  @Get(':idOrPath')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Merchant',
    operationId: 'getMerchant',
  })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiOkResponse({ type: MerchantEntity })
  async get(@Param('idOrPath') idOrPath: string): Promise<MerchantEntity> {
    this.logger.verbose(this.get.name);
    const translations = this.currentTranslations();
    const merchant = await this.service.findOneByIdOrPath({
      where: { idOrPath },
    });

    if (!merchant) {
      throw new NotFoundException(translations.doesNotExist);
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
  @ApiBody({ type: SquarePostOauthBody })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiOkResponse({ description: 'Square Oauth confirmed' })
  async postMeSquareOauth(
    @Req() request: any,
    @Body()
    input: SquarePostOauthBody,
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
  @ApiBody({ type: StripePostCheckoutBody })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiOkResponse({ type: StripePostCheckoutResponse })
  async postMeStripeCheckout(
    @Req() request: MerchantsGuardedRequest,
    @Body() body: StripePostCheckoutBody,
  ): Promise<StripePostCheckoutResponse | null> {
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
  @ApiOkResponse({ type: StripeBillingSessionResponse })
  @ApiQuery({ name: 'returnUrl', required: true, type: String })
  async getMeStripeBillingSession(
    @Req() request: MerchantsGuardedRequest,
    @Query('returnUrl') returnUrl: string,
  ): Promise<StripeBillingSessionResponse | null> {
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
