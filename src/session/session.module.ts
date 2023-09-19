import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '../logger/logger.module.js';
import { Session } from './entities/session.entity.js';
import { SessionService } from './session.service.js';

@Module({
  imports: [LoggerModule, TypeOrmModule.forFeature([Session])],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
