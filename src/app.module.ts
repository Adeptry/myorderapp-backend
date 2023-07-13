import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeaderResolver } from 'nestjs-i18n';
import { I18nModule } from 'nestjs-i18n/dist/i18n.module';
import path from 'path';
import { AppConfigModule } from 'src/app-config/app-config.module';
import { AuthAppleModule } from 'src/auth-apple/auth-apple.module';
import { AuthFacebookModule } from 'src/auth-facebook/auth-facebook.module';
import { AuthGoogleModule } from 'src/auth-google/auth-google.module';
import { AuthTwitterModule } from 'src/auth-twitter/auth-twitter.module';
import { AuthModule } from 'src/auth/auth.module';
import { CatalogsModule } from 'src/catalogs/catalogs.module';
import appConfig from 'src/config/app.config';
import appleConfig from 'src/config/apple.config';
import authConfig from 'src/config/auth.config';
import { AllConfigType } from 'src/config/config.type';
import databaseConfig from 'src/config/database.config';
import facebookConfig from 'src/config/facebook.config';
import fileConfig from 'src/config/file.config';
import googleConfig from 'src/config/google.config';
import mailConfig from 'src/config/mail.config';
import squareConfig from 'src/config/square.config';
import stripeConfig from 'src/config/stripe.config';
import twilioConfig from 'src/config/twilio.config';
import twitterConfig from 'src/config/twitter.config';
import { TypeOrmConfigService } from 'src/database/typeorm-config.service';
import { FilesModule } from 'src/files/files.module';
import { FirebaseAdminModule } from 'src/firebase-admin/firebase-admin.module';
import { ForgotModule } from 'src/forgot/forgot.module';
import { LocationsModule } from 'src/locations/locations.module';
import { MailModule } from 'src/mail/mail.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { SessionModule } from 'src/session/session.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { TwilioModule } from 'src/twilio/twilio.module';
import { UsersModule } from 'src/users/users.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { CustomersModule } from './customers/customers.module';
import { OrdersModule } from './orders/orders.module';
import { GuardsModule } from './guards/guards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        facebookConfig,
        googleConfig,
        twitterConfig,
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
    AuthFacebookModule,
    AuthGoogleModule,
    AuthTwitterModule,
    AuthAppleModule,
    ForgotModule,
    SessionModule,
    MailModule,
    MailerModule,
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
  ],
})
export class AppModule {}
