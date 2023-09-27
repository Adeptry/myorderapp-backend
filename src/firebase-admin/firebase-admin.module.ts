import { Global, Module } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service.js';

@Global()
@Module({
  imports: [],
  exports: [FirebaseAdminService],
  providers: [FirebaseAdminService],
})
export class FirebaseAdminModule {}
