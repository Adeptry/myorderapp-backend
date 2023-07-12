import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.transformBigInt(data)));
  }

  private transformBigInt(object: any): any {
    if (object === null) {
      return null;
    }
    switch (typeof object) {
      case 'bigint':
        return object.toString();
      case 'object':
        for (const key in object) {
          object[key] = this.transformBigInt(object[key]);
        }
        return object;
      default:
        return object;
    }
  }
}
