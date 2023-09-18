import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { SquareWebhookController } from './square-webhook.controller.js';
import { SquareService } from './square.service.js';

@Module({
  imports: [AuthModule, forwardRef(() => MerchantsModule)],
  exports: [SquareService],
  providers: [SquareService],
  controllers: [SquareWebhookController],
})
export class SquareModule {}
