import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import Stripe from 'stripe';
import { AllConfigType } from '../config.type.js';
import { AppLogger } from '../logger/app.logger.js';
import { StripeConfigUtils } from '../stripe/stripe.config.utils.js';
import { StripeService } from '../stripe/stripe.service.js';
import { User } from '../users/entities/user.entity.js';
import { MerchantsService } from './merchants.service.js';

@Injectable()
export class MerchantsStripeService {
  constructor(
    protected readonly service: MerchantsService,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    private readonly configService: ConfigService<AllConfigType>,
    private readonly stripeService: StripeService,
    private readonly stripeConfigUtils: StripeConfigUtils,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MerchantsStripeService.name);
  }

  async createBillingPortalSession(params: {
    merchantId: string;
    returnUrl: string;
  }) {
    this.logger.verbose(this.createBillingPortalSession.name);
    const { merchantId, returnUrl } = params;

    const merchant = await this.service.findOneOrFail({
      where: { id: merchantId },
    });

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

  async createCheckoutSessionId(params: {
    merchantId: string;
    successUrl: string;
    cancelUrl?: string;
    stripePriceId: string;
  }): Promise<string | null> {
    this.logger.verbose(this.createCheckoutSessionId.name);
    const { merchantId, stripePriceId } = params;

    const merchant = await this.service.findOneOrFail({
      where: { id: merchantId },
    });

    const user = await this.service.loadOneRelation<User>(merchant, 'user');
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
        const tier = this.stripeConfigUtils.tierForStripePriceId(
          updateSubscriptionPriceId,
        );

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
      const tier = this.stripeConfigUtils.tierForStripePriceId(priceId);

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
}
