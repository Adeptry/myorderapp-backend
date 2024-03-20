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

import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter.js';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestSquareModule } from 'nest-square';
import { NestStripeModule } from 'nest-stripe2';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  I18nService,
} from 'nestjs-i18n';
import { S3Module } from 'nestjs-s3';
import * as NodemailerMailgunTransport from 'nodemailer-mailgun-transport';
import path, { dirname } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { fileURLToPath } from 'url';
import { AdminModule } from './admin/admin.module.js';
import { RootConfigType } from './app.config.js';
import { NestAppConfig } from './configs/app.config.js';
import { AwsS3Config } from './configs/aws-s3.config.js';
import { MailerConfig } from './configs/mailer.config.js';
import { TwilioConfig } from './configs/twilio.config.js';
import { DatabaseConfig } from './database/database.config.js';
import { TypeOrmConfigService } from './database/typeorm-config.service.js';
import { HealthModule } from './health/health.module.js';
import { MyOrderAppSquareConfig } from './moa-square/moa-square.config.js';
import { MyOrderAppSquareModule } from './moa-square/moa-square.module.js';

@Module({
  imports: [
    HealthModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        NestAppConfig,
        DatabaseConfig,
        MailerConfig,
        TwilioConfig,
        AwsS3Config,
        MyOrderAppSquareConfig,
      ],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions | undefined) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return new DataSource(options!).initialize();
      },
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<RootConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: {
          path: path.join(
            dirname(fileURLToPath(import.meta.url)),
            '../src/i18n/',
          ),
          watch: true,
        },
        typesOutputPath: path.join(
          dirname(fileURLToPath(import.meta.url)),
          '../src/i18n/i18n.generated.ts',
        ),
        viewEngine: 'hbs',
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<RootConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
        AcceptLanguageResolver,
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      useFactory: (
        configService: ConfigService<RootConfigType>,
        i18n: I18nService,
      ) => {
        return {
          transport: NodemailerMailgunTransport.default({
            auth: {
              api_key: configService.getOrThrow('mailer.authApiKey', {
                infer: true,
              }),
              domain: configService.getOrThrow('mailer.authDomain', {
                infer: true,
              }),
            },
          }),
          defaults: {
            from: configService.getOrThrow('mailer.defaultsFrom', {
              infer: true,
            }),
          },
          template: {
            dir: path.join(
              dirname(fileURLToPath(import.meta.url)),
              '../src/mail/templates/',
            ),
            adapter: new HandlebarsAdapter({ t: i18n.hbsHelper }),
            options: {
              strict: true,
            },
          },
        };
      },
      imports: [ConfigModule],
      inject: [ConfigService, I18nService],
    }),
    S3Module.forRootAsync({
      useFactory: (configService: ConfigService<RootConfigType>) => ({
        config: {
          credentials: {
            accessKeyId: configService.getOrThrow('awsS3.accessKeyId', {
              infer: true,
            }),
            secretAccessKey: configService.getOrThrow('awsS3.secretAccessKey', {
              infer: true,
            }),
          },
          region: configService.getOrThrow('awsS3.region', {
            infer: true,
          }),
          forcePathStyle: true,
          signatureVersion: 'v4',
        },
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    NestSquareModule.fromEnv(),
    NestStripeModule.fromEnv(),
    AdminModule,
    MyOrderAppSquareModule,
  ],
  controllers: [],
})
export class AppModule {}
