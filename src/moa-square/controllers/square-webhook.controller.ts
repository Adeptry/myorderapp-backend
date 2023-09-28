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
    const { body, hostname, originalUrl } = request;
    const { squareWebhookSignatureKey } = this.config;
    const notificationUrl = `https://${hostname}${originalUrl}`;

    if (signature && request.rawBody) {
      const rawBodyString = request.rawBody.toString();
      this.logger.log(`signature: ${signature}`);
      this.logger.log(`rawBodyString: ${rawBodyString}`);
      this.logger.log(
        `squareWebhookSignatureKey: ${squareWebhookSignatureKey}`,
      );
      this.logger.log(`notificationUrl: ${notificationUrl}`);

      const isValid = WebhooksHelper.isValidWebhookEventSignature(
        rawBodyString,
        signature,
        squareWebhookSignatureKey,
        notificationUrl,
      );

      if (isValid) {
        this.eventEmitter.emit(`square.${body.type}`, body);
        return;
      }
    }

    this.logger.error('Invalid Square webhook signature');
  }
}
