import {
  Body,
  Controller,
  Headers,
  Inject,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksHelper } from 'square';
import { AllConfigType } from 'src/config.type';

@Controller('v2/square/webhook')
export class SquareWebhookController {
  private readonly logger = new Logger(SquareWebhookController.name);

  constructor(
    @Inject(ConfigService)
    private configService: ConfigService<AllConfigType>,
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
