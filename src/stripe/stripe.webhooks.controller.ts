import {
  Controller,
  Headers,
  Inject,
  Logger,
  Post,
  RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AllConfigType } from 'src/config.type';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';

@Controller('v2/stripe/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly service: StripeService,
    @Inject(ConfigService)
    private readonly configService: ConfigService<AllConfigType>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @ApiExcludeEndpoint()
  @Post()
  webhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
    @Res({ passthrough: true }) response: Response,
  ) {
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
    } catch (err) {
      this.logger.error(`Stripe webhook received: ${err.message}`);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    this.logger.log(`Stripe webhook received: ${event.type}`);
    this.eventEmitter.emit(`stripe.${event.type}`, event);
  }
}
