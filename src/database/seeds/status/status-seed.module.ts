import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusEntity } from '../../../users/entities/status.entity.js';
import { StatusSeedService } from './status-seed.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([StatusEntity])],
  providers: [StatusSeedService],
  exports: [StatusSeedService],
})
export class StatusSeedModule {}
