import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pRetry from 'p-retry';
import Stripe from 'stripe';
import { AllConfigType } from '../config.type.js';
import { AppLogger } from '../logger/app.logger.js';

@Injectable()
export class StripeService {
  private client: Stripe;

  constructor(
    private configService: ConfigService<AllConfigType>,
    private logger: AppLogger,
  ) {
    logger.setContext(StripeService.name);
    const apiKey = this.configService.getOrThrow('stripe.apiKey', {
      infer: true,
    });
    if (apiKey) {
      this.client = new Stripe(apiKey, {
        apiVersion: '2022-11-15',
      });
    } else {
      this.logger.error('Missing Stripe API key');
      throw new InternalServerErrorException('Missing Stripe API key');
    }
  }

  async createCustomer(
    params?: Stripe.CustomerCreateParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Customer> {
    this.logger.verbose(this.createCheckoutSession.name);
    return pRetry(() => this.client.customers.create(params, options), {
      onFailedAttempt: (error) => {
        this.logger.error(error);
        if (error.retriesLeft === 0) {
          throw new InternalServerErrorException(error);
        }
      },
    });
  }

  async createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    this.logger.verbose(this.createCheckoutSession.name);
    return pRetry(() => this.client.checkout.sessions.create(params, options), {
      onFailedAttempt: (error) => {
        this.logger.error(error);
        if (error.retriesLeft === 0) {
          throw new InternalServerErrorException(error);
        }
      },
    });
  }

  async retrieveCheckoutSession(
    id: string,
    params?: Stripe.Checkout.SessionRetrieveParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    this.logger.verbose(this.retrieveCheckoutSession.name);
    return pRetry(
      () => this.client.checkout.sessions.retrieve(id, params, options),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  async createBillingPortalSession(
    params: Stripe.BillingPortal.SessionCreateParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Response<Stripe.BillingPortal.Session>> {
    this.logger.verbose(this.createBillingPortalSession.name);
    return pRetry(
      () => this.client.billingPortal.sessions.create(params, options),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  webhooksConstructEvent(
    payload: string | Buffer,
    header: string | Buffer | string[],
    secret: string,
    tolerance?: number | undefined,
    cryptoProvider?: Stripe.CryptoProvider | undefined,
    receivedAt?: number | undefined,
  ) {
    this.logger.verbose(this.webhooksConstructEvent.name);
    return this.client.webhooks.constructEvent(
      payload,
      header,
      secret,
      tolerance,
      cryptoProvider,
      receivedAt,
    );
  }
}
