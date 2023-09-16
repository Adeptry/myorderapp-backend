import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { GuardsModule } from '../guards/guards.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { SquareModule } from '../square/square.module.js';
import { CardsController } from './cards.controller.js';

@Module({
  imports: [
    SquareModule,
    GuardsModule,
    AuthModule,
    CustomersModule,
    MerchantsModule,
  ],
  controllers: [CardsController],
})
export class CardsModule {}
