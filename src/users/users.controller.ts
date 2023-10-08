import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
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
  getMe(@Req() request: JwtGuardedRequest) {
    this.logger.verbose(this.getMe.name);
    return this.service.findOne({ where: { id: request.user.id } });
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserEntity })
  @ApiOperation({ operationId: 'patchUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBody({ type: UserPatchBody })
  async patchMe(
    @Req() request: JwtGuardedRequest,
    @Body() body: UserPatchBody,
  ) {
    const { user } = request;
    const { id } = user;

    this.logger.verbose(this.patchMe.name);
    const translations = this.translations();

    if (id == undefined) {
      throw new UnprocessableEntityException(translations.idNotFound);
    }

    return await this.service.patch(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      { where: { id } },
      body,
    );
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ type: UserEntity })
  @ApiOperation({ operationId: 'deleteUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async deleteMe(@Req() request: JwtGuardedRequest) {
    this.logger.verbose(this.deleteMe.name);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.service.delete(request.user.id!);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.sessionService.delete({ userId: request.user.id! });
    return;
  }
}
