import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import appConfig from '../../app.config.js';
import databaseConfig from '../../database/database.config.js';
import { TypeOrmConfigService } from '../../database/typeorm-config.service.js';
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
      load: [databaseConfig, appConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
  ],
})
export class SeedModule {}
