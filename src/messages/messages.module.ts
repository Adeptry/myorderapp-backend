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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TwilioModule } from 'nestjs-twilio';
import { RootConfigType } from 'src/app.config.js';
import { UsersModule } from '../users/users.module.js';
import { MessagesService } from './messages.service.js';

@Module({
  imports: [
    ConfigModule,
    TwilioModule.forRootAsync({
      useFactory: (configService: ConfigService<RootConfigType>) => ({
        accountSid: configService.getOrThrow('twilio.accountSid', {
          infer: true,
        }),
        authToken: configService.getOrThrow('twilio.authToken', {
          infer: true,
        }),
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
