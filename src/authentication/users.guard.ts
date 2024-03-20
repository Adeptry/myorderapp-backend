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
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { AuthenticationService } from './authentication.service.js';

export interface UsersGuardedRequest extends Request {
  user: UserEntity;
}

@Injectable()
export class UsersGuard implements CanActivate {
  private readonly logger = new Logger(UsersGuard.name);

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

    request.user = user;

    return true;
  }
}
