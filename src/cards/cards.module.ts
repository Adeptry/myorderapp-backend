import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { GuardsModule } from '../guards/guards.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { SquareModule } from '../square/square.module.js';
import { CardsController } from './cards.controller.js';

@Module({
  imports: [
    SquareModule,
    GuardsModule,
    AuthenticationModule,
    CustomersModule,
    MerchantsModule,
    LoggerModule,
  ],
  controllers: [CardsController],
})
export class CardsModule {}
