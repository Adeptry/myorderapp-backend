import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeNullInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((value) => this.stripNullValues(value)));
  }

  private stripNullValues(value: any) {
    if (Array.isArray(value)) {
      return value.map((item) => this.stripNullValues(item));
    }
    if (value !== null && typeof value === 'object') {
      return Object.keys(value).reduce((result, key) => {
        if (value[key] !== null) {
          result[key] = this.stripNullValues(value[key]);
        }
        return result;
      }, {});
    }
    return value;
  }
}
