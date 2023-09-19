import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '../logger/logger.module.js';
import { Forgot } from './entities/forgot.entity.js';
import { ForgotService } from './forgot.service.js';

@Module({
  imports: [LoggerModule, TypeOrmModule.forFeature([Forgot])],
  providers: [ForgotService],
  exports: [ForgotService],
})
export class ForgotModule {}
