import {
  Body,
  Controller,
  Headers,
  Inject,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request } from 'express';
import { WebhooksHelper } from 'square';
import { SquareConfig } from './square.config.js';

@Controller('v2/square/webhook')
export class SquareWebhookController {
  private readonly logger = new Logger(SquareWebhookController.name);

  constructor(
    @Inject(SquareConfig.KEY)
    private config: ConfigType<typeof SquareConfig>,
    private eventEmitter: EventEmitter2,
  ) {}

  @ApiExcludeEndpoint()
  @Post()
  post(
    @Headers('x-square-signature') signature: string,
    @Body() body: any,
    @Req() request: Request,
  ) {
    this.logger.verbose(this.post.name);
    if (
      !this.config.webhookSignatureKey ||
      !WebhooksHelper.isValidWebhookEventSignature(
        body,
        signature,
        this.config.webhookSignatureKey,
        request.url,
      )
    ) {
      return;
    }

    this.logger.log(body.type);
    this.eventEmitter.emit(`square.${body.type}`, body);
  }
}
