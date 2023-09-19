import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request } from 'express';
import { WebhooksHelper } from 'square';
import { AllConfigType } from '../config.type.js';
import { AppLogger } from '../logger/app.logger.js';

@Controller('v2/square/webhook')
export class SquareWebhookController {
  constructor(
    private configService: ConfigService<AllConfigType>,
    private eventEmitter: EventEmitter2,
    private logger: AppLogger,
  ) {
    this.logger.setContext(SquareWebhookController.name);
  }

  @ApiExcludeEndpoint()
  @Post()
  post(
    @Headers('x-square-signature') signature: string,
    @Body() body: any,
    @Req() request: Request,
  ) {
    this.logger.verbose(this.post.name);
    if (
      !WebhooksHelper.isValidWebhookEventSignature(
        body,
        signature,
        this.configService.getOrThrow('square.webhookSignatureKey', {
          infer: true,
        }),
        request.url,
      )
    ) {
      return;
    }

    this.logger.log(body.type);
    this.eventEmitter.emit(`square.${body.type}`, body);
  }
}
