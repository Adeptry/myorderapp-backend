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
import { Controller, Headers, Inject, Logger, Post, Req } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request } from 'express';
import { WebhooksHelper } from 'square';
import { MyOrderAppSquareConfig } from '../moa-square.config.js';

@Controller('v2/square/webhook')
export class SquareWebhookController {
  private readonly logger = new Logger(SquareWebhookController.name);

  constructor(
    @Inject(MyOrderAppSquareConfig.KEY)
    private readonly config: ConfigType<typeof MyOrderAppSquareConfig>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @ApiExcludeEndpoint()
  @Post()
  post(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-square-hmacsha256-signature') signature?: string,
  ) {
    this.logger.verbose(this.post.name);
    const { body, hostname, originalUrl, rawBody } = request;
    const { squareWebhookSignatureKey } = this.config;

    if (signature && rawBody) {
      const isValid = WebhooksHelper.isValidWebhookEventSignature(
        rawBody.toString(),
        signature,
        squareWebhookSignatureKey,
        `https://${hostname}${originalUrl}`,
      );

      if (isValid) {
        this.eventEmitter.emit(`square.${body.type}`, body);
        return;
      }
    }

    this.logger.error('Invalid Square webhook signature');
  }
}
