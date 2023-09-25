import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { AuthGoogleController } from './auth-google.controller.js';
import { AuthGoogleService } from './auth-google.service.js';

@Module({
  imports: [ConfigModule, AuthenticationModule, LoggerModule],
  providers: [AuthGoogleService],
  exports: [AuthGoogleService],
  controllers: [AuthGoogleController],
})
export class AuthGoogleModule {}
