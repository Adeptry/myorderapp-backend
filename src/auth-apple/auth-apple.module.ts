import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { AuthAppleController } from './auth-apple.controller.js';
import { AuthAppleService } from './auth-apple.service.js';

@Module({
  imports: [ConfigModule, AuthModule, LoggerModule],
  providers: [AuthAppleService],
  exports: [AuthAppleService],
  controllers: [AuthAppleController],
})
export class AuthAppleModule {}
