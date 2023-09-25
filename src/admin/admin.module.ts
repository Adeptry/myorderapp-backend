import { Module } from '@nestjs/common';
import { AdminController } from '../admin/admin.controller.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';

@Module({
  imports: [AuthenticationModule, MerchantsModule, LoggerModule],
  controllers: [AdminController],
  providers: [],
  exports: [],
})
export class AdminModule {}
