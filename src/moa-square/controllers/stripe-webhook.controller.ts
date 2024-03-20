/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

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
      event = this.service.client.webhooks.constructEvent(
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
