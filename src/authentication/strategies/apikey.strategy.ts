import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { NestAppConfig } from '../../configs/app.config.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { AuthenticationService } from '../authentication.service.js';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'api-key',
) {
  private readonly logger = new Logger(ApiKeyStrategy.name);

  constructor(
    protected i18n: I18nService<I18nTranslations>,
    private service: AuthenticationService,
    @Inject(NestAppConfig.KEY)
    protected config: ConfigType<typeof NestAppConfig>,
  ) {
    super(
      {
        header: config.headerApiKey,
        prefix: '',
      },
      true,
      (
        apiKey: string,
        done: (err: Error | null, user?: any, info?: any) => void,
      ) => {
        this.logger.verbose('verify');
        const translations = this.currentLanguageTranslations();
        const validated = this.service.validateApiKey(apiKey);
        this.logger.verbose(`validate: ${validated}, apiKey: ${apiKey}`);
        if (validated) {
          done(null, true);
        } else {
          done(new UnauthorizedException(translations['401']), null);
        }
      },
    );
    this.logger.verbose(this.constructor.name);
  }

  currentLanguageTranslations() {
    return this.i18n.t('errors', {
      lang: I18nContext.current()?.lang,
    });
  }
}
