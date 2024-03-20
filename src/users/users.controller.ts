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
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  ParseBoolPipe,
  Patch,
  Query,
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
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiKeyAuthGuard } from '../authentication/apikey-auth.guard.js';
import type { JwtGuardedRequest } from '../authentication/strategies/jwt.strategy.js';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { SessionService } from '../session/session.service.js';
import { ErrorResponse } from '../utils/error-response.js';
import { UserPatchBody } from './dto/user-update.dto.js';
import { UserEntity } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

@ApiBearerAuth()
@ApiSecurity('Api-Key')
@UseGuards(ApiKeyAuthGuard, AuthGuard('jwt'))
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '2',
})
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly service: UsersService,
    private readonly sessionService: SessionService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  translations() {
    return this.i18n.t('users', {
      lang: I18nContext.current()?.lang,
    });
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserEntity })
  @ApiOperation({ operationId: 'getUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiQuery({ name: 'customers', required: false, type: Boolean })
  @ApiQuery({ name: 'merchants', required: false, type: Boolean })
  getMe(
    @Req() request: JwtGuardedRequest,
    @Query('customers', new DefaultValuePipe(false), ParseBoolPipe)
    customersRelation?: boolean,
    @Query('merchants', new DefaultValuePipe(false), ParseBoolPipe)
    merchantsRelation?: boolean,
  ) {
    this.logger.verbose(this.getMe.name);
    return this.service.findOne({
      where: { id: request.user.id },
      relations: {
        customers: customersRelation,
        merchants: merchantsRelation,
      },
    });
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserEntity })
  @ApiOperation({ operationId: 'patchUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBody({ type: UserPatchBody })
  @ApiQuery({ name: 'customers', required: false, type: Boolean })
  @ApiQuery({ name: 'merchants', required: false, type: Boolean })
  async patchMe(
    @Req() request: JwtGuardedRequest,
    @Body() body: UserPatchBody,
    @Query('customers', new DefaultValuePipe(false), ParseBoolPipe)
    customersRelation?: boolean,
    @Query('merchants', new DefaultValuePipe(false), ParseBoolPipe)
    merchantsRelation?: boolean,
  ) {
    const { user } = request;
    const { id } = user;

    this.logger.verbose(this.patchMe.name);
    const translations = this.translations();

    if (id == undefined) {
      throw new UnprocessableEntityException(translations.idNotFound);
    }

    await this.service.patch({ where: { id } }, body);

    return this.service.findOne({
      where: { id },
      relations: {
        customers: customersRelation,
        merchants: merchantsRelation,
      },
    });
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ type: UserEntity })
  @ApiOperation({ operationId: 'deleteUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async deleteMe(@Req() request: JwtGuardedRequest) {
    const { user } = request;
    const { id } = user;

    this.logger.verbose(this.deleteMe.name);
    const translations = this.translations();

    if (id == undefined) {
      throw new UnprocessableEntityException(translations.idNotFound);
    }

    await this.service.delete(id);
    await this.sessionService.delete({ userId: id });

    return;
  }
}
