import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { AppLogger } from '../logger/app.logger.js';
import { ErrorResponse } from './error-response.js';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  logger: AppLogger;

  constructor(logger: AppLogger) {
    this.logger = logger;
    this.logger.setContext(GlobalExceptionsFilter.name);
  }

  catch(exception: any, host: ArgumentsHost): void {
    this.logger.error(JSON.stringify(exception));
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

        const response = exception.getResponse();
        if (typeof response === 'string') {
          message = response;
        } else if (typeof response === 'object' && response !== null) {
          message = (response as any).message ?? ''; // Fallback to an empty string or some default
          fields = (response as any).fields ?? {}; // Fallback to an empty object or some default
        }
      } else if (exception instanceof QueryFailedError) {
        statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
        message = translations?.unprocessableEntity ?? exception.message;
      } else if (exception instanceof EntityNotFoundError) {
        statusCode = HttpStatus.NOT_FOUND;
        message = translations?.notFound ?? exception.message;
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