import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CatalogsModule } from 'src/catalogs/catalogs.module';
import { FirebaseAdminModule } from 'src/firebase-admin/firebase-admin.module';
import { LocationsModule } from 'src/locations/locations.module';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { MerchantsController } from 'src/merchants/merchants.controller';
import { MerchantsService } from 'src/merchants/merchants.service';
import { SquareModule } from 'src/square/square.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { UsersModule } from 'src/users/users.module';
import { MerchantsGuard } from './merchants.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant]),
    StripeModule,
    SquareModule,
    FirebaseAdminModule,
    AuthModule,
    UsersModule,
    forwardRef(() => CatalogsModule),
    forwardRef(() => LocationsModule),
  ],
  controllers: [MerchantsController],
  providers: [MerchantsService, MerchantsGuard],
  exports: [MerchantsService],
})
export class MerchantsModule {}
