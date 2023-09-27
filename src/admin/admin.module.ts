import { Module } from '@nestjs/common';
import { AdminController } from '../admin/admin.controller.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { MyOrderAppSquareModule } from '../moa-square/moa-square.module.js';

@Module({
  imports: [AuthenticationModule, MyOrderAppSquareModule],
  controllers: [AdminController],
  providers: [],
  exports: [],
})
export class AdminModule {}
