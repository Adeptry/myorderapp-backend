import {
  DynamicModule,
  ForwardReference,
  InjectionToken,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';
import { NestSquareConfigType } from './nest-square.config';

export interface NestSquareAsyncOptions {
  imports?: (
    | Type<any>
    | DynamicModule
    | Promise<DynamicModule>
    | ForwardReference<any>
  )[];
  useFactory: (
    ...args: any[]
  ) => Promise<NestSquareConfigType> | NestSquareConfigType;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
}
