import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestAppConfig } from 'src/app.config.js';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmConfigService } from '../../database/typeorm-config.service.js';
import { DatabaseConfig } from '../database.config.js';
import { RoleSeedModule } from './role/role-seed.module.js';
import { StatusSeedModule } from './status/status-seed.module.js';
import { UserSeedModule } from './user/user-seed.module.js';

@Module({
  imports: [
    RoleSeedModule,
    StatusSeedModule,
    UserSeedModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [DatabaseConfig, NestAppConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions | undefined) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return new DataSource(options!).initialize();
      },
    }),
  ],
})
export class SeedModule {}
