import { Module } from '@nestjs/common';
import { AdminController } from '../admin/admin.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';

@Module({
  imports: [AuthModule, MerchantsModule, LoggerModule],
  controllers: [AdminController],
  providers: [],
  exports: [],
})
export class AdminModule {}
