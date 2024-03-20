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
