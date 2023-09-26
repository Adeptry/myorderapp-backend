import { Module } from '@nestjs/common';
import { AdminController } from '../admin/admin.controller.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';

@Module({
  imports: [AuthenticationModule, MerchantsModule],
  controllers: [AdminController],
  providers: [],
  exports: [],
})
export class AdminModule {}
