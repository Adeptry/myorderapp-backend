import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import { AppConfigModule } from 'src/app-config/app-config.module';
import { AppModule } from 'src/app.module';
import { AuthAppleModule } from 'src/auth-apple/auth-apple.module';
import { AuthFacebookModule } from 'src/auth-facebook/auth-facebook.module';
import { AuthGoogleModule } from 'src/auth-google/auth-google.module';
import { AuthTwitterModule } from 'src/auth-twitter/auth-twitter.module';
import { AuthModule } from 'src/auth/auth.module';
import { CardsModule } from 'src/cards/cards.module';
import { CatalogsModule } from 'src/catalogs/catalogs.module';
import { AllConfigType } from 'src/config.type';
import { CustomersModule } from 'src/customers/customers.module';
import { LocationsModule } from 'src/locations/locations.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { OrdersModule } from 'src/orders/orders.module';
import { SquareModule } from 'src/square/square.module';
import { BigIntInterceptor } from 'src/utils/big-int.intercepter';
import validationOptions from 'src/utils/validation-options';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalInterceptors(new BigIntInterceptor());

  SwaggerModule.setup(
    'merchants/docs',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('MyOrderApp Merchants API')
        .setVersion('2.0.1')
        .addBearerAuth()
        .addServer(
          configService.getOrThrow('app.backendDomain', { infer: true }),
        )
        .build(),
      {
        include: [
          AuthAppleModule,
          AuthFacebookModule,
          AuthGoogleModule,
          AuthTwitterModule,
          SquareModule,
          MerchantsModule,
          AuthModule,
          AppConfigModule,
          LocationsModule,
          CatalogsModule,
        ],
      },
    ),
    {
      jsonDocumentUrl: 'merchants/docs.json',
      yamlDocumentUrl: 'merchants/docs.yaml',
    },
  );

  SwaggerModule.setup(
    'customers/docs',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('MyOrderApp Customers API')
        .setVersion('2.0.1')
        .addBearerAuth()
        .addServer(
          configService.getOrThrow('app.backendDomain', { infer: true }),
        )
        .build(),
      {
        include: [
          AuthAppleModule,
          AuthFacebookModule,
          AuthGoogleModule,
          AuthTwitterModule,
          AuthModule,
          AppConfigModule,
          CustomersModule,
          CardsModule,
          OrdersModule,
          LocationsModule,
          CatalogsModule,
        ],
      },
    ),
    {
      jsonDocumentUrl: 'customers/docs.json',
      yamlDocumentUrl: 'customers/docs.yaml',
    },
  );

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
