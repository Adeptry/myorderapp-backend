import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CatalogsModule } from 'src/catalogs/catalogs.module';
import { CustomersModule } from 'src/customers/customers.module';
import { LocationsModule } from 'src/locations/locations.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { Order } from 'src/orders/entities/order.entity';
import { SquareModule } from 'src/square/square.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    SquareModule,
    AuthModule,
    LocationsModule,
    CatalogsModule,
    forwardRef(() => MerchantsModule),
    forwardRef(() => CustomersModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
