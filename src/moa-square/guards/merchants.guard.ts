/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

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
    request.user = user;

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
