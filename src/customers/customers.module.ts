import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { CustomersController } from '../customers/customers.controller.js';
import { CustomersService } from '../customers/customers.service.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { GuardsModule } from '../guards/guards.module.js';
import { LocationsModule } from '../locations/locations.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { SquareModule } from '../square/square.module.js';
import { UsersModule } from '../users/users.module.js';
import { AppInstall } from './entities/app-install.entity.js';
import { AppInstallsService } from './services/app-installs.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, AppInstall]),
    SquareModule,
    GuardsModule,
    AuthModule,
    LocationsModule,
    UsersModule,
    forwardRef(() => MerchantsModule),
  ],
  exports: [CustomersService],
  controllers: [CustomersController],
  providers: [CustomersService, AppInstallsService],
})
export class CustomersModule {}
