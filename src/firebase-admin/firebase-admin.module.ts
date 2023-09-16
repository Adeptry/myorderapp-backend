import { Module } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service.js';

@Module({
  exports: [FirebaseAdminService],
  providers: [FirebaseAdminService],
})
export class FirebaseAdminModule {}
