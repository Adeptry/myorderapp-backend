import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module.js';
import { SessionModule } from '../session/session.module.js';
import { IsExist } from '../utils/validators/is-exists.validator.js';
import { IsNotExist } from '../utils/validators/is-not-exists.validator.js';
import { UserEntity } from './entities/user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), SessionModule, MailModule],
  controllers: [UsersController],
  providers: [IsExist, IsNotExist, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
