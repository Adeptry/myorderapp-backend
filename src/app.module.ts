import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter.js';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import appConfig from './app.config.js';
import appleConfig from './auth-apple/apple.config.js';
import { AuthAppleModule } from './auth-apple/auth-apple.module.js';
import { AuthGoogleModule } from './auth-google/auth-google.module.js';
import googleConfig from './auth-google/google.config.js';
import authConfig from './auth/auth.config.js';
import { AuthModule } from './auth/auth.module.js';
import { CardsModule } from './cards/cards.module.js';
import { CatalogsModule } from './catalogs/catalogs.module.js';
import { AllConfigType } from './config.type.js';
import { CustomersModule } from './customers/customers.module.js';
import databaseConfig from './database/database.config.js';
import { TypeOrmConfigService } from './database/typeorm-config.service.js';
import fileConfig from './files/file.config.js';
import { FilesModule } from './files/files.module.js';
import { FirebaseAdminModule } from './firebase-admin/firebase-admin.module.js';
import { ForgotModule } from './forgot/forgot.module.js';
import { GuardsModule } from './guards/guards.module.js';
import { HealthModule } from './health/health.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { LoggerModule } from './logger/logger.module.js';
import mailConfig from './mail/mail.config.js';
import { MailModule } from './mail/mail.module.js';
import { MerchantsModule } from './merchants/merchants.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { SessionModule } from './session/session.module.js';
import squareConfig from './square/square.config.js';
import stripeConfig from './stripe/stripe.config.js';
import { StripeModule } from './stripe/stripe.module.js';
import twilioConfig from './twilio/twilio.config.js';
import { TwilioModule } from './twilio/twilio.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        googleConfig,
        appleConfig,
        squareConfig,
        stripeConfig,
        twilioConfig,
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
      ) => ({
        transport: NodemailerMailgunTransport.default({
          auth: {
            api_key: configService.getOrThrow('mail.authApiKey', {
              infer: true,
            }),
            domain: configService.getOrThrow('mail.authDomain', {
              infer: true,
            }),
          },
        }),
        defaults: {
          from: configService.getOrThrow('mail.defaultsFrom', {
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
      }),
      imports: [ConfigModule],
      inject: [ConfigService, I18nService],
    }),
    LoggerModule,
    UsersModule,
    AuthModule,
    AuthGoogleModule,
    AuthAppleModule,
    ForgotModule,
    SessionModule,
    MailModule,
    TwilioModule,
    StripeModule,
    MerchantsModule,
    CustomersModule,
    LocationsModule,
    CatalogsModule,
    FirebaseAdminModule,
    AppConfigModule,
    FilesModule,
    OrdersModule,
    GuardsModule,
    CardsModule,
    HealthModule,
    AdminModule,
  ],
  controllers: [],
})
export class AppModule {}
