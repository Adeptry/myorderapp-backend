import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { AuthAppleConfig } from './auth-apple.config.js';
import { AuthAppleController } from './auth-apple.controller.js';
import { AuthAppleService } from './auth-apple.service.js';

@Module({
  imports: [ConfigModule.forFeature(AuthAppleConfig), AuthenticationModule],
  providers: [AuthAppleService],
  exports: [AuthAppleService],
  controllers: [AuthAppleController],
})
export class AuthAppleModule {}
