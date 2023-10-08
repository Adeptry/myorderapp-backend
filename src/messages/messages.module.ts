import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TwilioModule } from 'nestjs-twilio';
import { RootConfigType } from 'src/app.config.js';
import { UsersModule } from '../users/users.module.js';
import { MessagesService } from './messages.service.js';

@Module({
  imports: [
    ConfigModule,
    TwilioModule.forRootAsync({
      useFactory: (configService: ConfigService<RootConfigType>) => ({
        accountSid: configService.getOrThrow('twilio.accountSid', {
          infer: true,
        }),
        authToken: configService.getOrThrow('twilio.authToken', {
          infer: true,
        }),
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
