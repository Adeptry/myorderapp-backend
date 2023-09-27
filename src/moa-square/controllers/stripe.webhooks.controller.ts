import type { RawBodyRequest } from '@nestjs/common';
import {
  Controller,
  Headers,
  Inject,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { NestStripeService } from 'nest-stripe2';
import Stripe from 'stripe';
import { MyOrderAppSquareConfig } from '../moa-square.config.js';

@Controller('v2/stripe/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  constructor(
    private readonly service: NestStripeService,
    @Inject(MyOrderAppSquareConfig.KEY)
    private readonly config: ConfigType<typeof MyOrderAppSquareConfig>,

    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  @ApiExcludeEndpoint()
  @Post()
  post(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.logger.verbose(this.post.name);

    if (!request.rawBody) {
      return;
    }

    if (!this.config.stripeWebhookSecret) {
      throw new InternalServerErrorException();
    }

    let event: Stripe.Event | undefined;

    try {
      event = this.service.stripe.webhooks.constructEvent(
        request.rawBody,
        signature,
        this.config.stripeWebhookSecret,
      );
    } catch (err: any) {
      this.logger.error(`Stripe webhook received: ${err.message}`);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    this.logger.log(`Stripe webhook received: ${event.type}`);
    this.eventEmitter.emit(`stripe.${event.type}`, event);
  }
}
