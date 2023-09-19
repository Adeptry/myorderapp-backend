import type { RawBodyRequest } from '@nestjs/common';
import { Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { AllConfigType } from '../config.type.js';
import { AppLogger } from '../logger/app.logger.js';
import { StripeService } from './stripe.service.js';

@Controller('v2/stripe/webhook')
export class StripeWebhookController {
  constructor(
    private readonly service: StripeService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(StripeWebhookController.name);
  }

  @ApiExcludeEndpoint()
  @Post()
  post(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.logger.verbose(this.post.name);
    const webhookSecret = this.configService.getOrThrow(
      'stripe.webhookSecret',
      {
        infer: true,
      },
    );

    if (!request.rawBody) {
      return;
    }

    let event: Stripe.Event | undefined;

    try {
      event = this.service.webhooksConstructEvent(
        request.rawBody,
        signature,
        webhookSecret,
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
