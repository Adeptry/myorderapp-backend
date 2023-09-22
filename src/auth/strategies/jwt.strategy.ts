import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AllConfigType } from '../../config.type.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { AppLogger } from '../../logger/app.logger.js';
import { SessionService } from '../../session/session.service.js';
import { OrNeverType } from '../../utils/types/or-never.type.js';
import { JwtPayloadType } from './types/jwt-payload.type.js';

export interface JwtGuardedRequest extends Request {
  user: JwtPayloadType;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    protected logger: AppLogger,
    protected i18n: I18nService<I18nTranslations>,
    protected configService: ConfigService<AllConfigType>,
    protected sessionService: SessionService,
  ) {
    logger.setContext(JwtStrategy.name);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.secret', { infer: true }),
    });
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
