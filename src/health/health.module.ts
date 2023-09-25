import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [TerminusModule, AuthenticationModule, HttpModule, LoggerModule],
  controllers: [HealthController],
})
export class HealthModule {}
