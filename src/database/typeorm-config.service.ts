import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { DatabaseConfig } from './database.config.js';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  private readonly logger = new Logger(TypeOrmConfigService.name);

  constructor(
    @Inject(DatabaseConfig.KEY)
    private readonly config: ConfigType<typeof DatabaseConfig>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    this.logger.verbose(this.createTypeOrmOptions.name);
    return {
      type: this.config.type,
      url: this.config.url,
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      database: this.config.name,
      synchronize: this.config.synchronize,
      dropSchema: false,
      keepConnectionAlive: true,
      logging: this.config.logging,
      entities: [
        dirname(fileURLToPath(import.meta.url)) + '/../**/*.entity{.ts,.js}',
      ],
      migrations: [
        dirname(fileURLToPath(import.meta.url)) + '/migrations/**/*{.ts,.js}',
      ],
      cli: {
        entitiesDir: 'src',
        migrationsDir: 'src/database/migrations',
        subscribersDir: 'subscriber',
      },
      extra: {
        // based on https://node-postgres.com/apis/pool
        // max connection pool size
        max: this.config.maxConnections,
        ssl: this.config.sslEnabled
          ? {
              rejectUnauthorized: this.config.rejectUnauthorized,
              ca: this.config.ca ?? undefined,
              key: this.config.key ?? undefined,
              cert: this.config.cert ?? undefined,
            }
          : undefined,
      },
    } as TypeOrmModuleOptions;
  }
}
