import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { SquareWebhookController } from './square-webhook.controller.js';
import { SquareController } from './square.controller.js';
import { SquareService } from './square.service.js';

@Module({
  imports: [AuthModule, forwardRef(() => MerchantsModule)],
  exports: [SquareService],
  providers: [SquareService],
  controllers: [SquareController, SquareWebhookController],
})
export class SquareModule {}
