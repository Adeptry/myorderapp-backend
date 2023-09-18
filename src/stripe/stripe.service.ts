import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { AllConfigType } from '../config.type.js';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  private client: Stripe;

  constructor(private configService: ConfigService<AllConfigType>) {
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
    try {
      return await this.client.customers.create(params, options);
    } catch (error: any) {
      this.logger.error(`Failed to create customer: ${error}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    try {
      return await this.client.checkout.sessions.create(params, options);
    } catch (error: any) {
      this.logger.error(`Failed to create checkout session: ${error}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async retrieveCheckoutSession(
    id: string,
    params?: Stripe.Checkout.SessionRetrieveParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    try {
      return await this.client.checkout.sessions.retrieve(id, params, options);
    } catch (error: any) {
      this.logger.error(`Failed to retrieve checkout session: ${error}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async createBillingPortalSession(
    params: Stripe.BillingPortal.SessionCreateParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Response<Stripe.BillingPortal.Session>> {
    try {
      return await this.client.billingPortal.sessions.create(params, options);
    } catch (error: any) {
      this.logger.error(`Failed to createBillingPortalSession: ${error}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  webhooksConstructEvent(
    payload: string | Buffer,
    header: string | Buffer | string[],
    secret: string,
    tolerance?: number | undefined,
    cryptoProvider?: Stripe.CryptoProvider | undefined,
    receivedAt?: number | undefined,
  ) {
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
