import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { I18nContext, I18nService } from 'nestjs-i18n';
import Stripe from 'stripe';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { StripeService } from '../stripe/stripe.service.js';
import { User } from '../users/entities/user.entity.js';
import { MerchantsConfigType } from './merchants.config.js';
import { MerchantsService } from './merchants.service.js';

@Injectable()
export class MerchantsStripeService {
  private readonly logger = new Logger(MerchantsStripeService.name);

  constructor(
    protected readonly service: MerchantsService,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    private readonly configService: ConfigService<MerchantsConfigType>,

    private readonly i18n: I18nService<I18nTranslations>,
    private readonly stripeService: StripeService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  currentTranslations() {
    return this.i18n.t('merchants', {
      lang: I18nContext.current()?.lang,
    });
  }

  async createBillingPortalSession(params: {
    merchantId: string;
    returnUrl: string;
  }) {
    this.logger.verbose(this.createBillingPortalSession.name);
    const translations = this.currentTranslations();
    const { merchantId, returnUrl } = params;

    const merchant = await this.service.findOneOrFail({
      where: { id: merchantId },
    });

    if (merchant.id == null) {
      throw new NotFoundException(translations.doesNotExist);
    }

    const stripeId = merchant.stripeId;
    if (stripeId == null) {
      throw new UnauthorizedException(translations.needsStripeId);
    }

    const session = await this.stripeService.responseOrThrow((stripe) =>
      stripe.billingPortal.sessions.create({
        customer: stripeId,
        return_url: returnUrl,
      }),
    );

    if (!session) {
      throw new InternalServerErrorException(
        translations.invalidStripeResponse,
      );
    }

    return session.url;
  }

  async createCheckoutSessionId(params: {
    merchantId: string;
    successUrl: string;
    cancelUrl?: string;
    stripePriceId: string;
  }): Promise<string | null> {
    this.logger.verbose(this.createCheckoutSessionId.name);
    const translations = this.currentTranslations();
    const { merchantId, stripePriceId } = params;

    const merchant = await this.service.findOneOrFail({
      where: { id: merchantId },
    });

    const user = await this.service.loadOneRelation<User>(merchant, 'user');
    if (!user) {
      throw new NotFoundException(translations.doesNotExist);
    }

    if (!merchant.stripeId) {
      throw new UnauthorizedException(translations.needsStripeId);
    }

    const response = await this.stripeService.responseOrThrow((stripe) =>
      stripe.checkout.sessions.create({
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
      }),
    );

    if (!response) {
      throw new InternalServerErrorException(
        translations.invalidStripeResponse,
      );
    }

    return response.id;
  }

  // Sent when a customer’s subscription ends.
  @OnEvent('stripe.customer.subscription.deleted')
  async handleCustomerSubscriptionDeleted(event: Stripe.Event) {
    this.logger.verbose(this.handleCustomerSubscriptionDeleted.name);
    const stripeSubscription = event.data.object as Stripe.Subscription;

    if (typeof stripeSubscription.customer === 'string') {
      const stripeCustomerId = stripeSubscription.customer;
      const merchant = await this.service.findOneOrFail({
        where: {
          stripeId: stripeCustomerId,
        },
        relations: {
          appConfig: true,
        },
      });

      if (!merchant) {
        this.logger.error(`Merchant with id ${stripeCustomerId} not found`);
        return;
      }

      // You can set the merchant tier to a default or 'inactive' state
      merchant.tier = -1;

      const appConfig = merchant.appConfig;
      if (!appConfig) {
        this.logger.error(`AppConfig not found for merchant ${merchant.id}`);
        return;
      }

      appConfig.enabled = false;
      await appConfig.save();

      this.logger.debug(`Setting merchant ${merchant.id} to deleted tier`);
      await this.service.save(merchant);
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
  async handleCustomerSubscriptionUpdated(event: Stripe.Event) {
    this.logger.verbose(this.handleCustomerSubscriptionUpdated.name);
    const stripeSubscription = event.data.object as Stripe.Subscription;

    if (typeof stripeSubscription.customer === 'string') {
      const stripeCustomerId = stripeSubscription.customer;
      const merchant = await this.service.findOneOrFail({
        where: {
          stripeId: stripeCustomerId,
        },
        relations: {
          appConfig: true,
        },
      });

      if (!merchant) {
        this.logger.error(`Merchant with id ${stripeCustomerId} not found`);
        return;
      }

      const updateSubscriptionPriceId =
        stripeSubscription.items?.data[0]?.price?.id;

      if (updateSubscriptionPriceId) {
        const tier = this.tierForStripePriceId(updateSubscriptionPriceId);

        if (tier != null) {
          merchant.tier = tier;
          await this.service.save(merchant);

          const appConfig = merchant.appConfig;
          if (!appConfig) {
            this.logger.error(
              `AppConfig not found for merchant ${merchant.id}`,
            );
            return;
          }

          appConfig.enabled = true;
          await appConfig.save();
        } else {
          this.logger.error(
            `Unknown tier for priceId ${updateSubscriptionPriceId}`,
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
    this.logger.verbose(this.handleStripeCustomerSubscriptionCreated.name);
    const stripeSubscription = event.data.object as Stripe.Subscription;

    if (typeof stripeSubscription.customer === 'string') {
      const stripeCustomerId = stripeSubscription.customer;
      const merchant = await this.service.findOneOrFail({
        where: {
          stripeId: stripeCustomerId,
        },
      });

      if (!merchant) {
        this.logger.error(`Merchant with id ${stripeCustomerId} not found`);
        return;
      }

      const priceId = stripeSubscription.items?.data[0]?.price?.id;
      const tier = this.tierForStripePriceId(priceId);

      if (priceId) {
        merchant.tier = tier;
        await this.service.save(merchant);
      } else {
        this.logger.error(`Missing 'priceId' in stripeSubscription`);
      }
    } else {
      this.logger.error("Missing 'customer' in stripeSubscription");
    }
  }

  tierForStripePriceId(priceId: string): number | null {
    if (this.isStripePriceIdTier0(priceId)) {
      return 0;
    } else if (this.isStripePriceIdTier1(priceId)) {
      return 1;
    } else if (this.isStripePriceIdTier2(priceId)) {
      return 2;
    } else {
      return null;
    }
  }

  isStripePriceIdTier2(priceId: string) {
    return Object.values(this.stripePriceIdsTier2()).includes(priceId);
  }

  stripePriceIdsTier2() {
    return {
      priceIdTier2USD: this.configService.getOrThrow(
        'merchants.stripePriceIdTier2USD',
        {
          infer: true,
        },
      ),
      priceIdTier2EUR: this.configService.getOrThrow(
        'merchants.stripePriceIdTier2EUR',
        {
          infer: true,
        },
      ),
      priceIdTier2GBP: this.configService.getOrThrow(
        'merchants.stripePriceIdTier2GBP',
        {
          infer: true,
        },
      ),
      priceIdTier2JPY: this.configService.getOrThrow(
        'merchants.stripePriceIdTier2JPY',
        {
          infer: true,
        },
      ),
      priceIdTier2CAD: this.configService.getOrThrow(
        'merchants.stripePriceIdTier2CAD',
        {
          infer: true,
        },
      ),
      priceIdTier2AUD: this.configService.getOrThrow(
        'merchants.stripePriceIdTier2AUD',
        {
          infer: true,
        },
      ),
    };
  }

  isStripePriceIdTier1(priceId: string) {
    return Object.values(this.stripePriceIdsTier1()).includes(priceId);
  }

  stripePriceIdsTier1() {
    return {
      priceIdTier1USD: this.configService.getOrThrow(
        'merchants.stripePriceIdTier1USD',
        {
          infer: true,
        },
      ),
      priceIdTier1EUR: this.configService.getOrThrow(
        'merchants.stripePriceIdTier1EUR',
        {
          infer: true,
        },
      ),
      priceIdTier1GBP: this.configService.getOrThrow(
        'merchants.stripePriceIdTier1GBP',
        {
          infer: true,
        },
      ),
      priceIdTier1JPY: this.configService.getOrThrow(
        'merchants.stripePriceIdTier1JPY',
        {
          infer: true,
        },
      ),
      priceIdTier1CAD: this.configService.getOrThrow(
        'merchants.stripePriceIdTier1CAD',
        {
          infer: true,
        },
      ),
      priceIdTier1AUD: this.configService.getOrThrow(
        'merchants.stripePriceIdTier1AUD',
        {
          infer: true,
        },
      ),
    };
  }

  isStripePriceIdTier0(priceId: string) {
    return Object.values(this.stripePriceIdsTier0()).includes(priceId);
  }

  stripePriceIdsTier0() {
    return {
      priceIdTier0USD: this.configService.getOrThrow(
        'merchants.stripePriceIdTier0USD',
        {
          infer: true,
        },
      ),
      priceIdTier0EUR: this.configService.getOrThrow(
        'merchants.stripePriceIdTier0EUR',
        {
          infer: true,
        },
      ),
      priceIdTier0GBP: this.configService.getOrThrow(
        'merchants.stripePriceIdTier0GBP',
        {
          infer: true,
        },
      ),
      priceIdTier0JPY: this.configService.getOrThrow(
        'merchants.stripePriceIdTier0JPY',
        {
          infer: true,
        },
      ),
      priceIdTier0CAD: this.configService.getOrThrow(
        'merchants.stripePriceIdTier0CAD',
        {
          infer: true,
        },
      ),
      priceIdTier0AUD: this.configService.getOrThrow(
        'merchants.stripePriceIdTier0AUD',
        {
          infer: true,
        },
      ),
    };
  }
}
