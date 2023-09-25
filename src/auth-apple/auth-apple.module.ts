import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { AuthAppleController } from './auth-apple.controller.js';
import { AuthAppleService } from './auth-apple.service.js';

@Module({
  imports: [ConfigModule, AuthenticationModule, LoggerModule],
  providers: [AuthAppleService],
  exports: [AuthAppleService],
  controllers: [AuthAppleController],
})
export class AuthAppleModule {}
