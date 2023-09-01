import { Module } from '@nestjs/common';
import { AdminController } from 'src/admin/admin.controller';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';
import { MerchantsModule } from 'src/merchants/merchants.module';

@Module({
  imports: [AuthModule, FilesModule, MerchantsModule],
  controllers: [AdminController],
  providers: [],
  exports: [],
})
export class AdminModule {}
