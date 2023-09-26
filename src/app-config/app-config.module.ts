import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { AwsS3FilesModule } from '../aws-s3-files/aws-s3-files.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { AppConfigController } from './app-config.controller.js';
import { AppConfigService } from './app-config.service.js';
import { AppConfig } from './entities/app-config.entity.js';

@Module({
  imports: [
    AuthenticationModule,
    TypeOrmModule.forFeature([AppConfig]),
    AwsS3FilesModule,
    forwardRef(() => MerchantsModule),
    forwardRef(() => CustomersModule),
  ],
  controllers: [AppConfigController],
  providers: [AppConfigService],
})
export class AppConfigModule {}
