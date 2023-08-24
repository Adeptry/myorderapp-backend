import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CatalogsModule } from 'src/catalogs/catalogs.module';
import { CustomersModule } from 'src/customers/customers.module';
import { FirebaseAdminModule } from 'src/firebase-admin/firebase-admin.module';
import { LocationsModule } from 'src/locations/locations.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { LineItemModifier } from 'src/orders/entities/line-item-modifier.entity';
import { LineItem } from 'src/orders/entities/line-item.entity';
import { Order } from 'src/orders/entities/order.entity';
import { OrdersController } from 'src/orders/orders.controller';
import { OrdersService } from 'src/orders/orders.service';
import { LineItemModifierService } from 'src/orders/services/line-item-modifier.service';
import { LineItemService } from 'src/orders/services/line-item.service';
import { SquareModule } from 'src/square/square.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, LineItem, LineItemModifier]),
    SquareModule,
    AuthModule,
    LocationsModule,
    CatalogsModule,
    FirebaseAdminModule,
    forwardRef(() => MerchantsModule),
    forwardRef(() => CustomersModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, LineItemService, LineItemModifierService],
})
export class OrdersModule {}
