import { Module } from '@nestjs/common';
import { AdminController } from '../admin/admin.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { FilesModule } from '../files/files.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';

@Module({
  imports: [AuthModule, FilesModule, MerchantsModule],
  controllers: [AdminController],
  providers: [],
  exports: [],
})
export class AdminModule {}
