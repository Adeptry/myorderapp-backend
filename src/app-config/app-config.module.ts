import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CustomersModule } from 'src/customers/customers.module';
import { FilesModule } from 'src/files/files.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { AppConfigController } from './app-config.controller';
import { AppConfigService } from './app-config.service';
import { AppConfig } from './entities/app-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppConfig]),
    AuthModule,
    FilesModule,
    forwardRef(() => MerchantsModule),
    forwardRef(() => CustomersModule),
  ],
  controllers: [AppConfigController],
  providers: [AppConfigService],
})
export class AppConfigModule {}
