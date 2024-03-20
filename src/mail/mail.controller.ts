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
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiKeyAuthGuard } from '../authentication/apikey-auth.guard.js';
import type { JwtGuardedRequest } from '../authentication/strategies/jwt.strategy.js';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { ContactPostBody } from '../users/dto/contact-post-body.dto.js';
import { SupportRequestPostBody } from '../users/dto/support-request-post-body.dto.js';
import { UsersService } from '../users/users.service.js';
import { ErrorResponse } from '../utils/error-response.js';
import { MailService } from './mail.service.js';

@ApiBearerAuth()
@ApiSecurity('Api-Key')
@UseGuards(ApiKeyAuthGuard, AuthGuard('jwt'))
@ApiTags('Mail')
@Controller({
  path: 'users',
  version: '2',
})
export class MailController {
  private readonly logger = new Logger(MailController.name);

  constructor(
    private readonly service: MailService,
    private readonly usersService: UsersService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  translations() {
    return this.i18n.t('users', {
      lang: I18nContext.current()?.lang,
    });
  }

  @Post('support')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send support request',
    operationId: 'postSupport',
  })
  @ApiBody({ type: SupportRequestPostBody })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiOkResponse({})
  async postSupport(
    @Req() request: JwtGuardedRequest,
    @Body() body: SupportRequestPostBody,
  ): Promise<void> {
    this.logger.verbose(this.postSupport.name);
    const translations = this.translations();

    const { user: jwtUser } = request;
    const { id: userId } = jwtUser;
    const { subject, text } = body;

    if (!userId) {
      throw new UnprocessableEntityException(translations.idNotFound);
    }

    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

    if (!user.email) {
      throw new UnprocessableEntityException(translations.emailNotFound);
    }

    if (!subject || !text) {
      throw new BadRequestException(translations.invalidInput);
    }

    await this.service.sendPostSupportOrThrow({
      user,
      subject,
      text,
    });

    return;
  }

  @Post('contact')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send contact',
    operationId: 'postContact',
  })
  @ApiBody({ type: ContactPostBody })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiOkResponse({})
  async postContact(
    @Req() request: JwtGuardedRequest,
    @Body() body: ContactPostBody,
  ): Promise<void> {
    this.logger.verbose(this.postContact.name);
    const translations = this.translations();

    const { user: jwtUser } = request;
    const { id: userId } = jwtUser;
    const { subject, text } = body;

    if (!userId) {
      throw new UnprocessableEntityException(translations.idNotFound);
    }

    const user = await this.usersService.findOneOrFail({
      where: { id: userId },
    });

    if (!user.email) {
      throw new UnprocessableEntityException(translations.emailNotFound);
    }

    if (!subject || !text) {
      throw new BadRequestException(translations.invalidInput);
    }

    await this.service.sendPostContactOrThrow({
      user,
      subject,
      text,
    });

    return;
  }
}
