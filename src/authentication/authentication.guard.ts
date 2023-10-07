import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { AuthenticationService } from './authentication.service.js';

export interface AuthenticatedRequest extends Request {
  user: UserEntity;
}

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly logger = new Logger(AuthenticationGuard.name);

  constructor(
    private readonly service: AuthenticationService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  translations() {
    return this.i18n.t('authentication', {
      lang: I18nContext.current()?.lang,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(this.canActivate.name);
    const translations = this.translations();

    const request = context.switchToHttp().getRequest();
    const user = await this.service.me(request.user);

    if (!user) {
      throw new UnauthorizedException(translations.userNotFound);
    }

    // Store user object in request for later use
    request.user = user;

    return true;
  }
}
