import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { SquareModule } from '../square/square.module.js';
import { CardsController } from './cards.controller.js';

@Module({
  imports: [
    AuthenticationModule,
    SquareModule,
    CustomersModule,
    MerchantsModule,
  ],
  controllers: [CardsController],
})
export class CardsModule {}
