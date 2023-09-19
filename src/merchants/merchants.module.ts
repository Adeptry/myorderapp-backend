import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { CatalogsModule } from '../catalogs/catalogs.module.js';
import { FirebaseAdminModule } from '../firebase-admin/firebase-admin.module.js';
import { GuardsModule } from '../guards/guards.module.js';
import { LocationsModule } from '../locations/locations.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { Merchant } from '../merchants/entities/merchant.entity.js';
import { MerchantsController } from '../merchants/merchants.controller.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { SquareModule } from '../square/square.module.js';
import { StripeModule } from '../stripe/stripe.module.js';
import { UsersModule } from '../users/users.module.js';
import { MerchantsSquareService } from './merchants.square.service.js';
import { MerchantsStripeService } from './merchants.stripe.service.js';

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forFeature([Merchant]),
    StripeModule,
    FirebaseAdminModule,
    AuthModule,
    UsersModule,
    ConfigModule,
    forwardRef(() => SquareModule),
    forwardRef(() => GuardsModule),
    forwardRef(() => CatalogsModule),
    forwardRef(() => LocationsModule),
  ],
  controllers: [MerchantsController],
  providers: [MerchantsService, MerchantsSquareService, MerchantsStripeService],
  exports: [MerchantsService, MerchantsSquareService, MerchantsStripeService],
})
export class MerchantsModule {}
