import { Body, Controller, Headers, Logger, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksHelper } from 'square';
import { AllConfigType } from '../config.type.js';

@Controller('v2/square/webhook')
export class SquareWebhookController {
  private readonly logger = new Logger(SquareWebhookController.name);

  constructor(
    private configService: ConfigService<AllConfigType>,
    private eventEmitter: EventEmitter2,
  ) {}

  @ApiExcludeEndpoint()
  @Post()
  post(
    @Headers('x-square-signature') signature: string,
    @Body() body: any,
    @Req() request: Request,
  ) {
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

    this.logger.log(`Square webhook received: ${body.type}`);
    this.eventEmitter.emit(`square.${body.type}`, body);
  }
}
