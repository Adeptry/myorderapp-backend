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

import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import appleSigninAuth from 'apple-signin-auth';
import { SocialInterface } from '../social/interfaces/social.interface.js';
import { AuthAppleConfig } from './auth-apple.config.js';
import { AuthAppleLoginDto } from './dto/auth-apple-login.dto.js';

@Injectable()
export class AuthAppleService {
  private readonly logger = new Logger(AuthAppleService.name);

  constructor(
    @Inject(AuthAppleConfig.KEY)
    private readonly config: ConfigType<typeof AuthAppleConfig>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  async getProfileByToken(
    loginDto: AuthAppleLoginDto,
  ): Promise<SocialInterface> {
    this.logger.verbose(this.getProfileByToken.name);
    const data = await appleSigninAuth.verifyIdToken(loginDto.idToken, {
      audience: this.config.appAudience,
    });

    return {
      id: data.sub,
      email: data.email,
      firstName: loginDto.firstName,
      lastName: loginDto.lastName,
    };
  }
}
