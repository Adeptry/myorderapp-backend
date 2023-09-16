import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from '../auth/auth.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [TerminusModule, AuthModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
