import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = exception.getStatus ? exception.getStatus() : 500;

    if (statusCode >= 500) {
      Sentry.captureException(exception);
    }

    const json = {
      statusCode: statusCode,
      message:
        exception?.message ??
        exception?.response?.message ??
        exception?.response?.error,
      fields: exception?.response?.fields ? exception.response.fields : {},
    };

    response.status(statusCode).json(json);
  }
}
