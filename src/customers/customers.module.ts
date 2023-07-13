import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CustomersController } from 'src/customers/customers.controller';
import { CustomersService } from 'src/customers/customers.service';
import { Customer } from 'src/customers/entities/customer.entity';
import { GuardsModule } from 'src/guards/guards.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { SquareModule } from 'src/square/square.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]),
    SquareModule,
    GuardsModule,
    AuthModule,
    forwardRef(() => MerchantsModule),
  ],
  exports: [CustomersService],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
