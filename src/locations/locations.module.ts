import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SquareModule } from '../square/square.module';
import { MoaLocation } from './entities/location.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MoaLocation]),
    forwardRef(() => SquareModule),
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
