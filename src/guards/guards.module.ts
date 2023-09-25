import { Module, forwardRef } from '@nestjs/common';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { UsersModule } from '../users/users.module.js';
import { CustomersGuard } from './customers.guard.js';
import { MerchantsGuard } from './merchants.guard.js';
import { UserTypeGuard } from './user-type.guard.js';
import { UsersGuard } from './users.guard.js';

@Module({
  imports: [
    LoggerModule,
    AuthenticationModule,
    UsersModule,
    forwardRef(() => MerchantsModule),
    forwardRef(() => CustomersModule),
  ],
  providers: [MerchantsGuard, UserTypeGuard, CustomersGuard, UsersGuard],
  exports: [MerchantsGuard, UserTypeGuard, CustomersGuard, UsersGuard],
})
export class GuardsModule {}
