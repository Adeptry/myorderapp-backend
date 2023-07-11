import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CustomersModule } from 'src/customers/customers.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { SquareModule } from '../square/square.module';
import { Location } from './entities/location.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
    AuthModule,
    SquareModule,
    CustomersModule,
    forwardRef(() => MerchantsModule),
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
