import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { CatalogsModule } from '../catalogs/catalogs.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { FirebaseAdminModule } from '../firebase-admin/firebase-admin.module.js';
import { LocationsModule } from '../locations/locations.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { LineItemModifier } from '../orders/entities/line-item-modifier.entity.js';
import { LineItem } from '../orders/entities/line-item.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { OrdersController } from '../orders/orders.controller.js';
import { OrdersService } from '../orders/orders.service.js';
import { LineItemModifierService } from '../orders/services/line-item-modifier.service.js';
import { LineItemService } from '../orders/services/line-item.service.js';
import { SquareModule } from '../square/square.module.js';
import { UsersModule } from '../users/users.module.js';
import { OrdersUtils } from './orders.utils.js';

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forFeature([Order, LineItem, LineItemModifier]),
    SquareModule,
    AuthenticationModule,
    LocationsModule,
    CatalogsModule,
    FirebaseAdminModule,
    MerchantsModule,
    UsersModule,
    forwardRef(() => MerchantsModule),
    forwardRef(() => CustomersModule),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    LineItemService,
    LineItemModifierService,
    OrdersUtils,
  ],
})
export class OrdersModule {}
