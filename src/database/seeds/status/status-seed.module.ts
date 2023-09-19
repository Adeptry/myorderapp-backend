import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '../../../logger/logger.module.js';
import { Status } from '../../../statuses/entities/status.entity.js';
import { StatusSeedService } from './status-seed.service.js';

@Module({
  imports: [LoggerModule, TypeOrmModule.forFeature([Status])],
  providers: [StatusSeedService],
  exports: [StatusSeedService],
})
export class StatusSeedModule {}
