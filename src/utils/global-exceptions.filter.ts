import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { EntityNotFoundError, QueryFailedError, TypeORMError } from 'typeorm';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { ErrorResponse } from './error-response.js';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  constructor() {
    this.logger.verbose(this.constructor.name);
  }

  catch(exception: any, host: ArgumentsHost): void {
    this.logger.error(JSON.stringify(exception));
    this.logger.error(typeof exception);
    const i18n = I18nContext.current<I18nTranslations>(host);
    const translations = i18n?.t('errors', { lang: i18n?.lang });
    const httpArgumentsHost = host.switchToHttp();
    const response = httpArgumentsHost.getResponse<Response>();
    const request = httpArgumentsHost.getRequest<Request>();

    let message = '';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let fields: Record<string, string> = {};

    if (exception instanceof Error) {
      message = exception.message;
      if (exception instanceof HttpException) {
        statusCode = exception.getStatus();
        message = (translations && translations[`${statusCode}`]) ?? '';
        const response = exception.getResponse();
        if (typeof response === 'string') {
          message = response;
        } else if (typeof response === 'object' && response !== null) {
          fields = (response as any).fields ?? {};

          if ((response as any).message?.length > 0) {
            message = (response as any).message;
          }

          const fallback = Object.values(fields).join(', ') + '.';
          if (message.length === 0 && fallback.length > 0) {
            message = fallback;
          }
        }
      } else if (exception instanceof QueryFailedError) {
        statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
        message = exception.message ?? (translations && translations['422']);
      } else if (exception instanceof EntityNotFoundError) {
        statusCode = HttpStatus.NOT_FOUND;
        message =
          (translations && translations['404']) ??
          exception.name ??
          exception.message;
      } else if (exception instanceof TypeORMError) {
        message = `${translations && translations['404']} ${exception.name}`;
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }

    if (statusCode >= 500) {
      Sentry.captureException(exception);
    }

    response.status(statusCode).json(
      new ErrorResponse({
        statusCode,
        message,
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        fields,
      }),
    );
  }
}
