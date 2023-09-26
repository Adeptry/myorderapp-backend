import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { CatalogsModule } from '../catalogs/catalogs.module.js';
import { FirebaseAdminModule } from '../firebase-admin/firebase-admin.module.js';
import { LocationsModule } from '../locations/locations.module.js';
import { Merchant } from '../merchants/entities/merchant.entity.js';
import { MerchantsController } from '../merchants/merchants.controller.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { SquareModule } from '../square/square.module.js';
import { StripeModule } from '../stripe/stripe.module.js';
import { MerchantsConfig } from './merchants.config.js';
import { MerchantsFirebaseService } from './merchants.firebase.service.js';
import { MerchantsGuard } from './merchants.guard.js';
import { MerchantsSquareService } from './merchants.square.service.js';
import { MerchantsStripeService } from './merchants.stripe.service.js';

@Module({
  imports: [
    AuthenticationModule,
    ConfigModule.forFeature(MerchantsConfig),
    TypeOrmModule.forFeature([Merchant]),
    SquareModule,
    StripeModule,
    FirebaseAdminModule,
    forwardRef(() => CatalogsModule),
    LocationsModule,
  ],
  controllers: [MerchantsController],
  providers: [
    MerchantsService,
    MerchantsSquareService,
    MerchantsStripeService,
    MerchantsFirebaseService,
    MerchantsGuard,
  ],
  exports: [
    MerchantsService,
    MerchantsSquareService,
    MerchantsStripeService,
    MerchantsFirebaseService,
    MerchantsGuard,
  ],
})
export class MerchantsModule {}
