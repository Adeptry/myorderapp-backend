import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    Sentry.captureException(exception);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = exception.getStatus ? exception.getStatus() : 500;

    response.status(statusCode).json({
      statusCode: statusCode,
      message: exception.response.error,
      fields: exception.response.fields ? exception.response.fields : {},
    });
  }
}
