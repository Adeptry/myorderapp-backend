import {
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import pRetry from 'p-retry';
import Stripe from 'stripe';
import { StripeConfig } from './stripe.config.js';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(
    @Inject(StripeConfig.KEY)
    private config: ConfigType<typeof StripeConfig>,
  ) {
    this.logger.verbose(this.constructor.name);

    this.stripe = new Stripe(this.config.apiKey, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      apiVersion: null,
    });
  }

  responseOrThrow<T>(stripeFn: (stripe: Stripe) => Promise<T>): Promise<T> {
    this.logger.verbose(this.responseOrThrow.name);
    return this.retryOrThrow(() => stripeFn(this.stripe));
  }

  async retryOrThrow<T>(fn: () => Promise<T>): Promise<T> {
    this.logger.verbose(this.retryOrThrow.name);
    return pRetry(fn, {
      onFailedAttempt: (error) => {
        this.logger.error(error);
        if (error instanceof Stripe.errors.StripeAPIError) {
          const statusCode = error.statusCode ?? 0;
          const isRetryable =
            statusCode >= HttpStatus.INTERNAL_SERVER_ERROR ||
            statusCode === HttpStatus.TOO_MANY_REQUESTS;

          if (!isRetryable || error.retriesLeft === 0) {
            this.logger.error(this.retryOrThrow.name, error);
            throw new InternalServerErrorException(error);
          }
        } else {
          throw error;
        }
      },
    });
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
    return this.stripe.webhooks.constructEvent(
      payload,
      header,
      secret,
      tolerance,
      cryptoProvider,
      receivedAt,
    );
  }
}
