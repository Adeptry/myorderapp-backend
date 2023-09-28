import {
  ClassSerializerInterceptor,
  Logger,
  UnprocessableEntityException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { ValidationError, useContainer } from 'class-validator';
import helmet from 'helmet';
// import { SpelunkerModule } from 'nestjs-spelunker';
import { AdminModule } from './admin/admin.module.js';
import { AppModule } from './app.module.js';
import { AuthAppleModule } from './auth-apple/auth-apple.module.js';
import { AuthGoogleModule } from './auth-google/auth-google.module.js';
import { AuthenticationModule } from './authentication/authentication.module.js';
import { NestAppConfig } from './configs/app.config.js';
import { HealthModule } from './health/health.module.js';
import { MyOrderAppSquareModule } from './moa-square/moa-square.module.js';
import { UsersModule } from './users/users.module.js';
import { BigIntInterceptor } from './utils/big-int.intercepter.js';
import { GlobalExceptionsFilter } from './utils/global-exceptions-filter.js';

async function bootstrap() {
  Sentry.init({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    dsn: process.env.SENTRY_DSN!,
    tracesSampleRate: 1.0,
    integrations: [new Sentry.Integrations.Http({ tracing: true })],
  });

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const config: ConfigType<typeof NestAppConfig> = app.get(NestAppConfig.KEY);
  const logger = new Logger(config.name);
  logger.log(bootstrap.name);

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  app.useGlobalFilters(new GlobalExceptionsFilter());

  app.enableCors({
    origin: RegExp(config.corsOriginRegExp),
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
  // app.useGlobalPipes(new I18nValidationPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors: ValidationError[]) => {
        const fields = Object.fromEntries(
          errors.map((error) => [
            error.property,
            Object.values(error.constraints ?? {}).join(', '),
          ]),
        );

        return new UnprocessableEntityException({
          fields,
        });
      },
    }),
  );

  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('MyOrderApp Square API')
        .setVersion('2.2.4')
        .addBearerAuth()
        .addApiKey(
          { type: 'apiKey', name: config.headerApiKey, in: 'header' },
          config.headerApiKey,
        )
        .addGlobalParameters({
          name: config.headerLanguage,
          in: 'header',
          required: false,
          schema: { type: 'string' },
        })
        .addServer(config.backendUrl)
        .build(),
      {
        include: [
          AuthAppleModule,
          AuthGoogleModule,
          AuthenticationModule,
          UsersModule,
          MyOrderAppSquareModule,
        ],
      },
    ),
    {
      jsonDocumentUrl: 'docs.json',
      yamlDocumentUrl: 'docs.yaml',
    },
  );

  SwaggerModule.setup(
    'admins/docs',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('MyOrderApp Admin API')
        .setVersion('2.2.4')
        .addBearerAuth()
        .addApiKey(
          { type: 'apiKey', name: config.headerApiKey, in: 'header' },
          config.headerApiKey,
        )
        .addServer(config.backendUrl)
        .build(),
      {
        include: [AdminModule, HealthModule],
      },
    ),
    {
      jsonDocumentUrl: 'admin/docs.json',
      yamlDocumentUrl: 'admin/docs.yaml',
    },
  );

  await app.listen(config.port);
  logger.log('Ready');

  // const tree = SpelunkerModule.explore(app);
  // const root = SpelunkerModule.graph(tree);
  // const edges = SpelunkerModule.findGraphEdges(root);
  // console.log('graph LR');
  // const mermaidEdges = edges.map(
  //   ({ from, to }) => `  ${from.module.name}-->${to.module.name}`,
  // );
  // console.log(mermaidEdges.join('\n'));
}
void bootstrap();
