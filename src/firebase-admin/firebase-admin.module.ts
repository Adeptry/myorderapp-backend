import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module.js';
import { FirebaseAdminService } from './firebase-admin.service.js';

@Module({
  imports: [LoggerModule],
  exports: [FirebaseAdminService],
  providers: [FirebaseAdminService],
})
export class FirebaseAdminModule {}
