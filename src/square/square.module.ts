import { Module, forwardRef } from '@nestjs/common';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { SquareWebhookController } from './square-webhook.controller.js';
import { SquareConfigUtils } from './square.config.utils.js';
import { SquareService } from './square.service.js';

@Module({
  imports: [
    LoggerModule,
    AuthenticationModule,
    forwardRef(() => MerchantsModule),
  ],
  exports: [SquareService, SquareConfigUtils],
  providers: [SquareService, SquareConfigUtils],
  controllers: [SquareWebhookController],
})
export class SquareModule {}
