import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter.js';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  I18nService,
} from 'nestjs-i18n';
import * as NodemailerMailgunTransport from 'nodemailer-mailgun-transport';
import path, { dirname } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { fileURLToPath } from 'url';
import { AdminModule } from './admin/admin.module.js';
import { AppConfigModule } from './app-config/app-config.module.js';
import { NestAppConfig } from './app.config.js';
import { AuthAppleModule } from './auth-apple/auth-apple.module.js';
import { AuthGoogleModule } from './auth-google/auth-google.module.js';
import { AuthenticationModule } from './authentication/authentication.module.js';
import { AwsS3FilesModule } from './aws-s3-files/aws-s3-files.module.js';
import { CardsModule } from './cards/cards.module.js';
import { CatalogsModule } from './catalogs/catalogs.module.js';
import { AllConfigType } from './config.type.js';
import { CustomersModule } from './customers/customers.module.js';
import { DatabaseConfig } from './database/database.config.js';
import { TypeOrmConfigService } from './database/typeorm-config.service.js';
import { FirebaseAdminModule } from './firebase-admin/firebase-admin.module.js';
import { ForgotModule } from './forgot/forgot.module.js';
import { HealthModule } from './health/health.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { MailModule } from './mail/mail.module.js';
import { MailerConfig } from './mailer.config.js';
import { MerchantsModule } from './merchants/merchants.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { SessionModule } from './session/session.module.js';
import { SquareModule } from './square/square.module.js';
import { StripeModule } from './stripe/stripe.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    HealthModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [NestAppConfig, DatabaseConfig, MailerConfig],
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
      useFactory: (configService: ConfigService<AllConfigType>) => ({
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
          useFactory: (configService: ConfigService<AllConfigType>) => {
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
        configService: ConfigService<AllConfigType>,
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

    // Boilerplate
    UsersModule,
    AdminModule,
    AuthenticationModule,
    AuthGoogleModule,
    AuthAppleModule,
    ForgotModule,
    SessionModule,

    // Vendors
    SquareModule,
    StripeModule,
    FirebaseAdminModule,
    AwsS3FilesModule,

    // (add nest-twilio)
    MailModule,

    // Make these one module:
    AppConfigModule,
    MerchantsModule,
    CustomersModule,
    LocationsModule,
    CatalogsModule,
    OrdersModule,
    CardsModule,
  ],
  controllers: [],
})
export class AppModule {}
