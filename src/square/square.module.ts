import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SquareWebhookController } from './square-webhook.controller.js';
import { SquareConfig } from './square.config.js';
import { SquareService } from './square.service.js';

@Module({
  imports: [ConfigModule.forFeature(SquareConfig)],
  exports: [SquareService],
  providers: [SquareService],
  controllers: [SquareWebhookController],
})
export class SquareModule {}
