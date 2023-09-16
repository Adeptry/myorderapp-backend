import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import firebaseAdminPkg from 'firebase-admin';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { CatalogsService } from '../catalogs/catalogs.service.js';
import { Catalog } from '../catalogs/entities/catalog.entity.js';
import { AllConfigType } from '../config.type.js';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service.js';
import { LocationsService } from '../locations/locations.service.js';
import { Merchant } from '../merchants/entities/merchant.entity.js';
import { SquareCatalogVersionUpdatedEventPayload } from '../square/payloads/square-catalog-version-updated-payload.entity.js';
import { SquareLocationCreatedEventPayload } from '../square/payloads/square-location-created-event-payload.entity.js';
import { SquareLocationUpdatedEventPayload } from '../square/payloads/square-location-updated-event-payload.entity.js';
import { SquareConfigUtils } from '../square/square.config.utils.js';
import { SquareService } from '../square/square.service.js';
import { StripeConfigUtils } from '../stripe/stripe.config.utils.js';
import { StripeService } from '../stripe/stripe.service.js';
import { User } from '../users/entities/user.entity.js';
import { EntityRepositoryService } from '../utils/entity-repository-service.js';
import { MerchantUpdateInput } from './dto/update-merchant.input.js';
import { MerchantTierEnum } from './entities/merchant-tier.enum.js';
const { credential } = firebaseAdminPkg;

@Injectable()
export class MerchantsService extends EntityRepositoryService<Merchant> {
  private readonly logger = new Logger(MerchantsService.name);
  private readonly stripeConfigUtils: StripeConfigUtils;
  private readonly squareConfigUtils: SquareConfigUtils;

  constructor(
    @InjectRepository(Merchant)
    protected readonly repository: Repository<Merchant>,
    @Inject(ConfigService)
    private readonly configService: ConfigService<AllConfigType>,
    @Inject(StripeService)
    private readonly stripeService: StripeService,
    @Inject(SquareService)
    private readonly squareService: SquareService,
    @Inject(FirebaseAdminService)
    private readonly firebaseAdminService: FirebaseAdminService,
    @Inject(forwardRef(() => CatalogsService))
    private readonly catalogsService: CatalogsService,
    @Inject(forwardRef(() => LocationsService))
    private readonly locationsService: LocationsService,
  ) {
    super(repository);
    this.stripeConfigUtils = new StripeConfigUtils(configService);
    this.squareConfigUtils = new SquareConfigUtils(configService);
  }

  async assignAndSave(id: string, updateInput: MerchantUpdateInput) {
    const entity = await this.findOneOrFail({ where: { id } });
    Object.assign(entity, updateInput);
    return await this.save(entity);
  }

  async squareConfirmOauth(params: {
    oauthAccessCode: string;
    merchant: Merchant;
  }) {
    const { merchant, oauthAccessCode } = params;

    const nodeEnv = this.configService.get('app.nodeEnv', { infer: true });
    const testCode = this.configService.get('square.testCode', { infer: true });
    const isTest = nodeEnv !== 'production' && oauthAccessCode === testCode;

    try {
      const accessTokenResult = isTest
        ? this.squareConfigUtils.testTokenReponse()
        : (
            await this.squareService.obtainToken({
              oauthAccessCode,
            })
          ).result;

      if (!accessTokenResult) {
        throw new InternalServerErrorException(
          'Failed to obtain token from Square service',
        );
      }

      const { accessToken, expiresAt, merchantId, refreshToken } =
        accessTokenResult;

      if (!expiresAt) {
        throw new InternalServerErrorException(
          'No expiry date provided in the access token',
        );
      }

      merchant.squareAccessToken = accessToken;
      merchant.squareExpiresAt = new Date(Date.parse(expiresAt));
      merchant.squareId = merchantId;
      merchant.squareRefreshToken = refreshToken;

      return this.save(merchant);
    } catch {
      throw new InternalServerErrorException(
        'Failed to obtain token from Square service',
      );
    }
  }

  async squareRefreshOauth(id: string) {
    const merchant = await this.findOneOrFail({
      where: { id },
    });
    const oauthRefreshToken = merchant.squareRefreshToken ?? '';
    const result = (
      await this.squareService.refreshToken({
        oauthRefreshToken,
      })
    ).result;
    merchant.squareAccessToken = result.accessToken;
    merchant.squareExpiresAt = new Date(Date.parse(result.expiresAt ?? ''));
    merchant.squareId = result.merchantId;
    merchant.squareRefreshToken = result.refreshToken;
    return await this.save(merchant);
  }

  async squareCatalogSync(params: { merchantId: string }) {
    const merchant = await this.findOne({ where: { id: params.merchantId } });

    if (merchant?.id == null) {
      throw new NotFoundException('Merchant id is null');
    }

    const squareAccessToken = merchant.squareAccessToken;
    if (squareAccessToken == null) {
      throw new UnauthorizedException('Square access token is null');
    }

    let catalog = await this.loadOneRelation<Catalog>(merchant, 'catalog');
    if (catalog == null) {
      catalog = this.catalogsService.createEmpty();
      merchant.catalog = catalog;
      await this.catalogsService.save(catalog);
      await this.save(merchant);
    }

    if (catalog.id == null) {
      throw new Error('Catalog id is null');
    }

    await this.catalogsService.squareSync({
      squareAccessToken,
      catalogId: catalog.id,
      merchantId: merchant.id,
    });

    return;
  }

  async squareLocationsSync(params: { merchant: Merchant }) {
    const entity = params.merchant;

    if (entity.id == null) {
      throw new NotFoundException('Merchant id is null');
    }

    const squareAccessToken = entity.squareAccessToken;
    if (squareAccessToken == null) {
      throw new UnauthorizedException('Square access token is null');
    }

    await this.locationsService.sync({
      merchantId: entity.id,
      squareAccessToken,
    });
  }

  async stripeCreateBillingPortalSession(params: {
    merchant: Merchant;
    returnUrl: string;
  }) {
    const { merchant, returnUrl } = params;

    if (merchant.id == null) {
      throw new NotFoundException('Merchant id is null');
    }

    const stripeId = merchant.stripeId;
    if (stripeId == null) {
      throw new UnauthorizedException('Stripe id is null');
    }

    const session = await this.stripeService.createBillingPortalSession({
      customer: stripeId,
      return_url: returnUrl,
    });

    if (!session) {
      throw new Error('Failed to retrieve session from Stripe service');
    }

    return session.url;
  }

  async stripeCreateCheckoutSessionId(params: {
    merchant: Merchant;
    successUrl: string;
    cancelUrl?: string;
    stripePriceId: string;
  }): Promise<string | null> {
    const { merchant, stripePriceId } = params;

    const user = await this.loadOneRelation<User>(merchant, 'user');
    if (!user) {
      throw new NotFoundException(`User with id ${merchant.userId} not found`);
    }

    if (!merchant.stripeId) {
      throw new UnauthorizedException('Stripe id is null');
    }

    const session = await this.stripeService.createCheckoutSession({
      mode: 'subscription',
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      customer: merchant.stripeId,
      client_reference_id: merchant.id,
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
    });

    if (!session) {
      throw new Error('Failed to retrieve session from Stripe service');
    }

    return session.id;
  }

  firebaseAdminApp(params: { merchant: Merchant }) {
    const entity = params.merchant;

    try {
      const app = this.firebaseAdminService.getApp(entity.id);
      return app;
    } catch {
      // do nothing, the app doesn't exist
    }
    try {
      const appOptions = JSON.parse(JSON.stringify(entity.firebaseAppOptions));
      const app = this.firebaseAdminService.initializeApp(
        {
          credential: credential.cert(appOptions),
          databaseURL: entity.firebaseDatabaseUrl,
        },
        entity.id,
      );
      return app;
    } catch (error) {
      this.logger.log(error);
      return null;
    }
  }

  /*
   * Square webhooks
   */

  @OnEvent('square.location.created')
  async handleSquareLocationCreated(
    payload: SquareLocationCreatedEventPayload,
  ) {
    if (!payload.merchant_id) {
      this.logger.error(
        'Missing merchant_id in SquareLocationCreatedEventPayload',
      );
      return;
    }

    const merchant = await this.findOne({
      where: { squareId: payload.merchant_id },
    });

    if (!merchant) {
      this.logger.error(`Merchant with id ${payload.merchant_id} not found`);
      return;
    }

    await this.squareLocationsSync({ merchant });
  }

  @OnEvent('square.location.updated')
  async handleSquareLocationUpdated(
    payload: SquareLocationUpdatedEventPayload,
  ) {
    if (!payload.merchant_id) {
      this.logger.error(
        'Missing merchant_id in SquareLocationCreatedEventPayload',
      );
      return;
    }

    const merchant = await this.findOne({
      where: { squareId: payload.merchant_id },
    });

    if (!merchant) {
      this.logger.error(`Merchant with id ${payload.merchant_id} not found`);
      return;
    }

    await this.squareLocationsSync({ merchant });
  }

  @OnEvent('square.catalog.version.updated')
  async handleSquareCatalogVersionUpdated(
    payload: SquareCatalogVersionUpdatedEventPayload,
  ) {
    if (!payload.merchant_id) {
      this.logger.error(
        'Missing merchant_id in SquareLocationCreatedEventPayload',
      );
      return;
    }

    const merchant = await this.findOne({
      where: { squareId: payload.merchant_id },
    });

    if (!merchant?.id) {
      this.logger.error(`Merchant with id ${payload.merchant_id} not found`);
      return;
    }

    await this.squareCatalogSync({ merchantId: merchant.id });
  }

  /*
   * Stripe webhooks
   */

  // Sent when a customer’s subscription ends.
  @OnEvent('stripe.customer.subscription.deleted')
  async handleStripeCustomerSubscriptionDeleted(event: Stripe.Event) {
    const stripeSubscription = event.data.object as Stripe.Subscription;

    if (typeof stripeSubscription.customer === 'string') {
      const stripeCustomerId = stripeSubscription.customer;
      const merchant = await this.findOne({
        where: {
          stripeId: stripeCustomerId,
        },
      });

      if (!merchant) {
        this.logger.error(`Merchant with id ${stripeCustomerId} not found`);
        return;
      }

      // You can set the merchant tier to a default or 'inactive' state
      merchant.tier = MerchantTierEnum.deleted;
      this.logger.debug(`Setting merchant ${merchant.id} to deleted tier`);
      await this.save(merchant);
    } else {
      this.logger.error("Missing 'customer' in stripeSubscription");
    }
  }

  /*
   * Sent when a subscription starts or changes. For example, renewing a
   * subscription, adding a coupon, applying a discount, adding an invoice item,
   * and changing plans all trigger this event.
   */
  @OnEvent('stripe.customer.subscription.updated')
  async handleStripeCustomerSubscriptionUpdated(event: Stripe.Event) {
    const stripeSubscription = event.data.object as Stripe.Subscription;

    if (typeof stripeSubscription.customer === 'string') {
      const stripeCustomerId = stripeSubscription.customer;
      const merchant = await this.findOne({
        where: {
          stripeId: stripeCustomerId,
        },
      });

      if (!merchant) {
        this.logger.error(`Merchant with id ${stripeCustomerId} not found`);
        return;
      }

      const updateSubscriptionPriceId =
        stripeSubscription.items?.data[0]?.price?.id;

      if (updateSubscriptionPriceId) {
        if (
          this.stripeConfigUtils.isProStripePriceId(updateSubscriptionPriceId)
        ) {
          if (merchant.tier !== MerchantTierEnum.pro) {
            merchant.tier = MerchantTierEnum.pro;
            this.logger.debug(`merchant ${merchant.tier} to pro tier`);
            await this.save(merchant);
          }
        } else if (
          this.stripeConfigUtils.isFreeStripePriceId(updateSubscriptionPriceId)
        ) {
          if (merchant.tier !== MerchantTierEnum.free) {
            this.logger.debug(`Setting merchant ${merchant.id} to free tier`);
            merchant.tier = MerchantTierEnum.free;
            await this.save(merchant);
          }
        } else {
          this.logger.error(
            `Unknown price id ${updateSubscriptionPriceId} for subscription`,
          );
        }
      } else {
        this.logger.error(`Missing 'priceId' in stripeSubscription`);
      }
    } else {
      this.logger.error("Missing 'customer' in stripeSubscription");
    }
  }

  /*
   * Sent when the subscription is created. The subscription status might be
   * incomplete if customer authentication is required to complete the payment
   * or if you set payment_behavior to default_incomplete. View subscription
   * payment behavior to learn more.
   */
  @OnEvent('stripe.customer.subscription.created')
  async handleStripeCustomerSubscriptionCreated(event: Stripe.Event) {
    const stripeSubscription = event.data.object as Stripe.Subscription;

    if (typeof stripeSubscription.customer === 'string') {
      const stripeCustomerId = stripeSubscription.customer;
      const merchant = await this.findOne({
        where: {
          stripeId: stripeCustomerId,
        },
      });

      if (!merchant) {
        this.logger.error(`Merchant with id ${stripeCustomerId} not found`);
        return;
      }

      const priceId = stripeSubscription.items?.data[0]?.price?.id;

      if (priceId) {
        if (this.stripeConfigUtils.isProStripePriceId(priceId)) {
          this.logger.debug(`Setting merchant ${merchant.id} to pro tier`);
          merchant.tier = MerchantTierEnum.pro;
          await this.save(merchant);
        } else if (this.stripeConfigUtils.isFreeStripePriceId(priceId)) {
          this.logger.debug(`Setting merchant ${merchant.id} to free tier`);
          merchant.tier = MerchantTierEnum.free;
          await this.save(merchant);
        } else {
          this.logger.error(`Unknown price id ${priceId} for subscription`);
        }
      } else {
        this.logger.error(`Missing 'priceId' in stripeSubscription`);
      }
    } else {
      this.logger.error("Missing 'customer' in stripeSubscription");
    }
  }
}
