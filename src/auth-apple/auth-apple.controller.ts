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
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../authentication/apikey-auth.guard.js';
import { AuthenticationService } from '../authentication/authentication.service.js';
import { AuthenticationResponse } from '../authentication/types/authentication-response.type.js';
import { RoleEnum } from '../users/roles.enum.js';
import { AuthAppleService } from './auth-apple.service.js';
import { AuthAppleLoginDto } from './dto/auth-apple-login.dto.js';

@ApiTags('Authentication')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'auth/apple',
  version: '2',
})
export class AuthAppleController {
  private readonly logger = new Logger(AuthAppleController.name);
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly authAppleService: AuthAppleService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apple login',
    operationId: 'postLoginApple',
  })
  @ApiOkResponse({ type: AuthenticationResponse })
  async postLogin(
    @Body() body: AuthAppleLoginDto,
  ): Promise<AuthenticationResponse> {
    this.logger.verbose(this.postLogin.name);
    const socialData = await this.authAppleService.getProfileByToken(body);

    return this.authenticationService.validateSocialLogin(
      'apple',
      socialData,
      RoleEnum.user,
    );
  }
}
