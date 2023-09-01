import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeaderResolver } from 'nestjs-i18n';
import { I18nModule } from 'nestjs-i18n/dist/i18n.module';
import path from 'path';
import { AppConfigModule } from 'src/app-config/app-config.module';
import appConfig from 'src/app.config';
import appleConfig from 'src/auth-apple/apple.config';
import { AuthAppleModule } from 'src/auth-apple/auth-apple.module';
import { AuthGoogleModule } from 'src/auth-google/auth-google.module';
import googleConfig from 'src/auth-google/google.config';
import authConfig from 'src/auth/auth.config';
import { AuthModule } from 'src/auth/auth.module';
import { CardsModule } from 'src/cards/cards.module';
import { CatalogsModule } from 'src/catalogs/catalogs.module';
import { AllConfigType } from 'src/config.type';
import { CustomersModule } from 'src/customers/customers.module';
import databaseConfig from 'src/database/database.config';
import { TypeOrmConfigService } from 'src/database/typeorm-config.service';
import fileConfig from 'src/files/file.config';
import { FilesModule } from 'src/files/files.module';
import { FirebaseAdminModule } from 'src/firebase-admin/firebase-admin.module';
import { ForgotModule } from 'src/forgot/forgot.module';
import { GuardsModule } from 'src/guards/guards.module';
import { HealthModule } from 'src/health/health.module';
import { LocationsModule } from 'src/locations/locations.module';
import { MailModule } from 'src/mail/mail.module';
import mailConfig from 'src/mailer/mail.config';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { OrdersModule } from 'src/orders/orders.module';
import { SessionModule } from 'src/session/session.module';
import squareConfig from 'src/square/square.config';
import stripeConfig from 'src/stripe/stripe.config';
import { StripeModule } from 'src/stripe/stripe.module';
import twilioConfig from 'src/twilio/twilio.config';
import { TwilioModule } from 'src/twilio/twilio.module';
import { UsersModule } from 'src/users/users.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AdminController } from './admin/admin.controller';
import { AdminModule } from './admin/admin.module';

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
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
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
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
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
  controllers: [AdminController],
})
export class AppModule {}
