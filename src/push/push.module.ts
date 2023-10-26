import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAdminModule } from '../firebase-admin/firebase-admin.module.js';
import { PushService } from './push.service.js';

@Module({
  imports: [ConfigModule, FirebaseAdminModule],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
