import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { SquareWebhookController } from './square-webhook.controller';
import { SquareController } from './square.controller';
import { SquareService } from './square.service';

@Module({
  imports: [AuthModule, forwardRef(() => MerchantsModule)],
  exports: [SquareService],
  providers: [SquareService],
  controllers: [SquareController, SquareWebhookController],
})
export class SquareModule {}
