import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { SquareModule } from '../square/square.module';
import { MoaLocation } from './entities/location.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MoaLocation]),
    forwardRef(() => AuthModule),
    forwardRef(() => SquareModule),
    forwardRef(() => MerchantsModule),
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
