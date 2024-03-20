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
import { AuthGoogleService } from './auth-google.service.js';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto.js';

@ApiTags('Authentication')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'auth/google',
  version: '2',
})
export class AuthGoogleController {
  private readonly logger = new Logger(AuthGoogleController.name);

  constructor(
    private readonly authService: AuthenticationService,
    private readonly authGoogleService: AuthGoogleService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Google login',
    operationId: 'postLoginGoogle',
  })
  @ApiOkResponse({ type: AuthenticationResponse })
  async postLogin(
    @Body() body: AuthGoogleLoginDto,
  ): Promise<AuthenticationResponse> {
    this.logger.verbose(this.postLogin.name);
    const socialData = await this.authGoogleService.getProfileByToken(body);

    return this.authService.validateSocialLogin(
      'google',
      socialData,
      RoleEnum.user,
    );
  }
}
