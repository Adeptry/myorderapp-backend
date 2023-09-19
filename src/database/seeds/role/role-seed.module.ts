import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLogger } from '../../../logger/app.logger.js';
import { Role } from '../../../roles/entities/role.entity.js';
import { RoleSeedService } from './role-seed.service.js';

@Module({
  imports: [AppLogger, TypeOrmModule.forFeature([Role])],
  providers: [RoleSeedService],
  exports: [RoleSeedService],
})
export class RoleSeedModule {}
