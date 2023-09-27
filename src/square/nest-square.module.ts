import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestSquareAsyncOptions } from './nest-square-async-options.js';
import {
  NestSquareConfig,
  NestSquareConfigType,
} from './nest-square.config.js';
import { NestSquareService } from './nest-square.service.js';

@Global()
@Module({})
export class NestSquareModule {
  static forRoot(options: NestSquareConfigType): DynamicModule {
    return {
      module: NestSquareModule,
      imports: [ConfigModule.forFeature(NestSquareConfig)],
      providers: [
        NestSquareService,
        {
          provide: 'NEST_SQUARE_CONFIG',
          useValue: options,
        },
      ],
      exports: [NestSquareService],
    };
  }

  static forRootAsync(options: NestSquareAsyncOptions): DynamicModule {
    return {
      module: NestSquareModule,
      imports: [
        ...(options.imports || []),
        ConfigModule.forFeature(NestSquareConfig),
      ],
      providers: [
        NestSquareService,
        {
          provide: 'NEST_SQUARE_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ],
      exports: [NestSquareService],
    };
  }
}
