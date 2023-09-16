import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ForgotModule } from '../forgot/forgot.module.js';
import { MailModule } from '../mail/mail.module.js';
import { SessionModule } from '../session/session.module.js';
import { UsersModule } from '../users/users.module.js';
import { IsExist } from '../utils/validators/is-exists.validator.js';
import { IsNotExist } from '../utils/validators/is-not-exists.validator.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AnonymousStrategy } from './strategies/anonymous.strategy.js';
import { ApiKeyStrategy } from './strategies/apikey.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    ForgotModule,
    SessionModule,
    PassportModule,
    MailModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    IsExist,
    IsNotExist,
    AuthService,
    JwtStrategy,
    ApiKeyStrategy,
    JwtRefreshStrategy,
    AnonymousStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
