import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AuthenticationService } from '../../authentication/authentication.service.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { UserEntity } from '../../users/entities/user.entity.js';
import { MerchantEntity } from '../entities/merchant.entity.js';
import { MerchantsService } from '../services/merchants.service.js';

export interface MerchantsGuardedRequest extends Request {
  merchant: MerchantEntity;
  user: UserEntity;
}

@Injectable()
export class MerchantsGuard implements CanActivate {
  private readonly logger = new Logger(MerchantsGuard.name);

  constructor(
    private readonly service: MerchantsService,
    private readonly authService: AuthenticationService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  translations() {
    return this.i18n.t('moaSquare', {
      lang: I18nContext.current()?.lang,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(this.canActivate.name);
    const request = context.switchToHttp().getRequest();
    const user = await this.authService.me(request.user);
    const translations = this.translations();
    if (!user) {
      throw new UnauthorizedException(translations.usersNotFound);
    }

    const merchant = await this.service.findOne({
      where: { userId: user.id },
    });
    if (!merchant) {
      throw new UnauthorizedException(translations.merchantsNotFound);
    }

    // Store merchant object in request for later use
    request.merchant = merchant;
    return true;
  }
}
