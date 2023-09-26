import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { AuthGoogleConfig } from './auth-google.config.js';
import { AuthGoogleController } from './auth-google.controller.js';
import { AuthGoogleService } from './auth-google.service.js';

@Module({
  imports: [ConfigModule.forFeature(AuthGoogleConfig), AuthenticationModule],
  providers: [AuthGoogleService],
  exports: [AuthGoogleService],
  controllers: [AuthGoogleController],
})
export class AuthGoogleModule {}
