import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '../../../logger/logger.module.js';
import { Role } from '../../../roles/entities/role.entity.js';
import { RoleSeedService } from './role-seed.service.js';

@Module({
  imports: [LoggerModule, TypeOrmModule.forFeature([Role])],
  providers: [RoleSeedService],
  exports: [RoleSeedService],
})
export class RoleSeedModule {}
