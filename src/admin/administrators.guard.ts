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
import { AuthenticationService } from '../authentication/authentication.service.js';

@Injectable()
export class AdministratorsGuard implements CanActivate {
  private readonly logger = new Logger(AdministratorsGuard.name);

  constructor(private authenticationService: AuthenticationService) {
    this.logger.verbose(this.constructor.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(this.canActivate.name);
    const request = context.switchToHttp().getRequest();
    const user = await this.authenticationService.me(request.user);

    if (!(user?.role?.id === 'admin')) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    request.user = user;

    return true;
  }
}
