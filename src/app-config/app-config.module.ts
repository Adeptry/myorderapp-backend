import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { FilesModule } from '../files/files.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { AppConfigController } from './app-config.controller.js';
import { AppConfigService } from './app-config.service.js';
import { AppConfig } from './entities/app-config.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppConfig]),
    AuthenticationModule,
    FilesModule,
    forwardRef(() => MerchantsModule),
    forwardRef(() => CustomersModule),
    LoggerModule,
  ],
  controllers: [AppConfigController],
  providers: [AppConfigService],
})
export class AppConfigModule {}
