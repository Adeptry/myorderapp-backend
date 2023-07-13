import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CustomersModule } from 'src/customers/customers.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { UsersModule } from 'src/users/users.module';
import { CustomersGuard } from './customers.guard';
import { MerchantsGuard } from './merchants.guard';
import { UserTypeGuard } from './user-type.guard';
import { UsersGuard } from './users.guard';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    forwardRef(() => MerchantsModule),
    forwardRef(() => CustomersModule),
  ],
  providers: [MerchantsGuard, UserTypeGuard, CustomersGuard, UsersGuard],
  exports: [MerchantsGuard, UserTypeGuard, CustomersGuard, UsersGuard],
})
export class GuardsModule {}
