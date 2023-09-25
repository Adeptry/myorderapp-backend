import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { AppLogger } from '../../logger/app.logger.js';
import { AuthenticationService } from '../authentication.service.js';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'api-key',
) {
  constructor(
    protected logger: AppLogger,
    protected i18n: I18nService<I18nTranslations>,
    private authService: AuthenticationService,
    protected configService: ConfigService,
  ) {
    super(
      {
        header: configService.getOrThrow<string>('HEADER_KEY_API_KEY', {
          infer: true,
        }),
        prefix: '',
      },
      true,
      (
        apiKey: string,
        done: (err: Error | null, user?: any, info?: any) => void,
      ) => {
        this.logger.verbose('verify');
        const translations = this.currentLanguageTranslations();
        if (this.authService.validateApiKey(apiKey)) {
          done(null, true);
        }
        done(new UnauthorizedException(translations.unauthorized), null);
      },
    );
    this.logger.setContext(ApiKeyStrategy.name);
  }

  currentLanguageTranslations() {
    return this.i18n.t('errors', {
      lang: I18nContext.current()?.lang,
    });
  }
}
