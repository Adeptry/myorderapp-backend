import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { SquareModule } from '../square/square.module.js';
import { Address } from './entities/address.entity.js';
import { BusinessHoursPeriod } from './entities/business-hours-period.entity.js';
import { Location } from './entities/location.entity.js';
import { LocationsController } from './locations.controller.js';
import { LocationsService } from './locations.service.js';
import { AddressService } from './services/address.service.js';
import { BusinessHoursPeriodsService } from './services/business-hours-period.service.js';

@Module({
  imports: [
    AuthenticationModule,
    TypeOrmModule.forFeature([Location, Address, BusinessHoursPeriod]),
    SquareModule,
    forwardRef(() => CustomersModule), // for CustomerMerchantGuard
    forwardRef(() => MerchantsModule), // for CustomerMerchantGuard
  ],
  controllers: [LocationsController],
  providers: [LocationsService, BusinessHoursPeriodsService, AddressService],
  exports: [LocationsService],
})
export class LocationsModule {}
