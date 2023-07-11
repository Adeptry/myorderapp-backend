import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  exports: [CustomersService],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
