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
    @Req() request: Request,
    @Headers('x-square-hmacsha256-signature') signature?: string,
  ) {
    this.logger.verbose(this.post.name);
    const { body, url } = request;
    const { squareWebhookSignatureKey } = this.config;

    if (signature) {
      const isValid = WebhooksHelper.isValidWebhookEventSignature(
        body,
        signature,
        squareWebhookSignatureKey,
        url,
      );

      if (isValid) {
        this.eventEmitter.emit(`square.${body.type}`, body);
        return;
      }
    }

    this.logger.error('Invalid Square webhook signature');
    this.logger.log(`Body: ${JSON.stringify(body)}`);
    this.logger.log(`Signature: ${signature}`);
    this.logger.log(`Has Signature Key: ${squareWebhookSignatureKey != null}`);
    this.logger.log(`URL: ${url}`);
    this.logger.log(`Headers: ${JSON.stringify(request.headers)}`);
  }
}
