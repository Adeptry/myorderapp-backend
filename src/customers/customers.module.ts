import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { CustomersController } from '../customers/customers.controller.js';
import { CustomersService } from '../customers/customers.service.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { LocationsModule } from '../locations/locations.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { SquareModule } from '../square/square.module.js';
import { UsersModule } from '../users/users.module.js';
import { CustomerMerchantGuard } from './customer-merchant.guard.js';
import { CustomersGuard } from './customers.guard.js';
import { AppInstall } from './entities/app-install.entity.js';
import { AppInstallsService } from './services/app-installs.service.js';

@Module({
  imports: [
    AuthenticationModule,
    TypeOrmModule.forFeature([Customer, AppInstall]),
    SquareModule,
    LocationsModule,
    UsersModule,
    forwardRef(() => MerchantsModule), // because of CustomerMerchantGuard
  ],
  controllers: [CustomersController],
  providers: [
    CustomersService,
    AppInstallsService,
    CustomersGuard,
    CustomerMerchantGuard,
  ],
  exports: [CustomersService, CustomersGuard, CustomerMerchantGuard],
})
export class CustomersModule {}
