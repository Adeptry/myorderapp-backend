import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { AuthGoogleController } from './auth-google.controller.js';
import { AuthGoogleService } from './auth-google.service.js';

@Module({
  imports: [ConfigModule, AuthModule, LoggerModule],
  providers: [AuthGoogleService],
  exports: [AuthGoogleService],
  controllers: [AuthGoogleController],
})
export class AuthGoogleModule {}
