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
import { AuthenticationConfig } from './authentication.config.js';
import { AuthenticationController } from './authentication.controller.js';
import { AuthenticationService } from './authentication.service.js';
import { AnonymousStrategy } from './strategies/anonymous.strategy.js';
import { ApiKeyStrategy } from './strategies/apikey.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    ConfigModule.forFeature(AuthenticationConfig),
    UsersModule,
    ForgotModule,
    SessionModule,
    PassportModule,
    MailModule,
    JwtModule.register({}),
  ],
  controllers: [AuthenticationController],
  providers: [
    IsExist,
    IsNotExist,
    AuthenticationService,
    JwtStrategy,
    ApiKeyStrategy,
    JwtRefreshStrategy,
    AnonymousStrategy,
  ],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
