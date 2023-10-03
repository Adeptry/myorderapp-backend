import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { SessionService } from '../../session/session.service.js';
import { OrNeverType } from '../../utils/or-never.type.js';
import { AuthenticationConfig } from '../authentication.config.js';
import { JwtPayloadType } from './types/jwt-payload.type.js';

export interface JwtGuardedRequest extends Request {
  user: JwtPayloadType;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    protected i18n: I18nService<I18nTranslations>,
    @Inject(AuthenticationConfig.KEY)
    protected readonly config: ConfigType<typeof AuthenticationConfig>,
    protected sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.secret,
    });
    this.logger.verbose(this.constructor.name);
  }

  public async validate(
    payload: JwtPayloadType,
  ): Promise<OrNeverType<JwtPayloadType>> {
    this.logger.verbose(this.validate.name);
    const translations = this.currentLanguageTranslations();
    if (!payload.id) {
      throw new UnauthorizedException(translations.unauthorized);
    }

    if (
      !(await this.sessionService.exist({ where: { id: payload.sessionId } }))
    ) {
      throw new UnauthorizedException(translations.unauthorized);
    }

    return payload;
  }

  currentLanguageTranslations() {
    return this.i18n.t('errors', {
      lang: I18nContext.current()?.lang,
    });
  }
}
