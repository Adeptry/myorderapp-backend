import {
  ClassSerializerInterceptor,
  UnprocessableEntityException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError, useContainer } from 'class-validator';
import helmet from 'helmet';
import { AdminModule } from './admin/admin.module.js';
import { AppConfigModule } from './app-config/app-config.module.js';
import { AppModule } from './app.module.js';
import { AuthAppleModule } from './auth-apple/auth-apple.module.js';
import { AuthGoogleModule } from './auth-google/auth-google.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CardsModule } from './cards/cards.module.js';
import { CatalogsModule } from './catalogs/catalogs.module.js';
import { AllConfigType } from './config.type.js';
import { CustomersModule } from './customers/customers.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { MerchantsModule } from './merchants/merchants.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { SquareModule } from './square/square.module.js';
import { UsersModule } from './users/users.module.js';
import { BigIntInterceptor } from './utils/big-int.intercepter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService<AllConfigType>);
  app.enableCors({
    origin: RegExp(
      configService.getOrThrow('app.corsOriginRegExp', { infer: true }),
    ),
  });
  app.use(helmet());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.enableShutdownHooks();
  // app.setGlobalPrefix(
  //   configService.getOrThrow('app.apiPrefix', { infer: true }),
  //   {
  //     exclude: ['/'],
  //   },
  // );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  // app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalInterceptors(new BigIntInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.reduce(
          (acc, e) => ({
            ...acc,
            [e.property]: Object.values(
              e.constraints ? e.constraints : {},
            ).join(', '),
          }),
          {},
        );

        return new UnprocessableEntityException({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: messages,
        });
      },
    }),
  );

  const headerKeyApiKey =
    configService.get<string>('HEADER_KEY_API_KEY', { infer: true }) || '';

  SwaggerModule.setup(
    'merchants/docs',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('MyOrderApp Merchants API')
        .setVersion('2.0.19')
        .addBearerAuth()
        .addApiKey(
          { type: 'apiKey', name: headerKeyApiKey, in: 'header' },
          headerKeyApiKey,
        )
        .addServer(configService.getOrThrow('app.backendUrl', { infer: true }))
        .build(),
      {
        include: [
          AuthAppleModule,
          AuthGoogleModule,
          SquareModule,
          MerchantsModule,
          AuthModule,
          UsersModule,
          OrdersModule,
          CustomersModule,
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
        .setVersion('2.0.19')
        .addBearerAuth()
        .addApiKey(
          { type: 'apiKey', name: headerKeyApiKey, in: 'header' },
          headerKeyApiKey,
        )
        .addServer(configService.getOrThrow('app.backendUrl', { infer: true }))
        .build(),
      {
        include: [
          AuthAppleModule,
          AuthGoogleModule,
          AuthModule,
          AppConfigModule,
          CustomersModule,
          UsersModule,
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

  SwaggerModule.setup(
    'admins/docs',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('MyOrderApp Admin API')
        .setVersion('2.0.19')
        .addBearerAuth()
        .addApiKey(
          { type: 'apiKey', name: headerKeyApiKey, in: 'header' },
          headerKeyApiKey,
        )
        .addServer(configService.getOrThrow('app.backendUrl', { infer: true }))
        .build(),
      {
        include: [AdminModule],
      },
    ),
    {
      jsonDocumentUrl: 'admin/docs.json',
      yamlDocumentUrl: 'admin/docs.yaml',
    },
  );

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
