import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CustomersModule } from 'src/customers/customers.module';
import { GuardsModule } from 'src/guards/guards.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { SquareModule } from 'src/square/square.module';
import { CardsController } from './cards.controller';

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
