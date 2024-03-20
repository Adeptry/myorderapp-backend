/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ForgotModule } from '../forgot/forgot.module.js';
import { MailModule } from '../mail/mail.module.js';
import { SessionModule } from '../session/session.module.js';
import { UsersModule } from '../users/users.module.js';
import { IsExist } from '../utils/is-exists.validator.js';
import { IsNotExist } from '../utils/is-not-exists.validator.js';
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
