import { Body, Controller, Headers, Logger, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksHelper } from 'square';
import { SquareConfig } from './square.config';

@Controller('v2/square/webhook')
export class SquareWebhookController {
  private readonly logger = new Logger(SquareWebhookController.name);

  constructor(
    private configService: ConfigService<SquareConfig>,
    private eventEmitter: EventEmitter2,
  ) {}

  @ApiExcludeEndpoint()
  @Post()
  webhook(
    @Headers('x-square-signature') signature: string,
    @Body() body: any,
    @Req() request: Request,
  ) {
    if (
      !WebhooksHelper.isValidWebhookEventSignature(
        body,
        signature,
        this.configService.getOrThrow('webhookSignatureKey', { infer: true }),
        request.url,
      )
    ) {
      return;
    }

    this.eventEmitter.emit(`square.${body.type}`, body);
  }
}
