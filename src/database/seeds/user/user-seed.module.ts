import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '../../../logger/logger.module.js';
import { User } from '../../../users/entities/user.entity.js';
import { UserSeedService } from './user-seed.service.js';

@Module({
  imports: [LoggerModule, TypeOrmModule.forFeature([User])],
  providers: [UserSeedService],
  exports: [UserSeedService],
})
export class UserSeedModule {}
