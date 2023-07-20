import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CustomersModule } from 'src/customers/customers.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { SquareModule } from 'src/square/square.module';
import { Address } from './entities/address.entity';
import { BusinessHoursPeriod } from './entities/business-hours-period.entity';
import { Location } from './entities/location.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { AddressService } from './services/address.service';
import { BusinessHoursPeriodsService } from './services/business-hours-period.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location, Address, BusinessHoursPeriod]),
    AuthModule,
    SquareModule,
    forwardRef(() => CustomersModule),
    forwardRef(() => MerchantsModule),
  ],
  controllers: [LocationsController],
  providers: [LocationsService, BusinessHoursPeriodsService, AddressService],
  exports: [LocationsService],
})
export class LocationsModule {}
