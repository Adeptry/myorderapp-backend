import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    Sentry.captureException(exception);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus ? exception.getStatus() : 500;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
