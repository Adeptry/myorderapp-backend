import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { ErrorResponse } from '../utils/error-response.js';
import { NullableType } from '../utils/nullable.type.js';
import { ApiKeyAuthGuard } from './apikey-auth.guard.js';
import { AuthenticationService } from './authentication.service.js';
import { AuthenticationEmailConfirmRequestBody } from './dto/authentication-email-confirm.dto.js';
import { AuthenticationEmailLoginRequestBody } from './dto/authentication-email-login.dto.js';
import { AuthenticationEmailRegisterRequestBody } from './dto/authentication-email-register.dto.js';
import { AuthenticationPasswordForgotRequestBody } from './dto/authentication-password-forgot.dto.js';
import { AuthenticationPasswordResetRequestBody } from './dto/authentication-password-reset.dto.js';
import { AuthenticationUpdateRequestBody } from './dto/authentication-update.dto.js';
import type { JwtGuardedRequest } from './strategies/jwt.strategy.js';
import { AuthenticationResponse } from './types/authentication-response.type.js';

@ApiTags('Authentication')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'auth',
  version: '2',
})
export class AuthenticationController {
  private readonly logger = new Logger(AuthenticationController.name);

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

  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get access token',
    operationId: 'postEmailLogin',
  })
  @ApiOkResponse({ type: AuthenticationResponse })
  @ApiUnauthorizedResponse({
    description: 'For invalid email/password',
    type: ErrorResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'If wrong provider, e.g. needs Apple/Google',
    type: ErrorResponse,
  })
  async postEmailLogin(
    @Body() body: AuthenticationEmailLoginRequestBody,
  ): Promise<AuthenticationResponse> {
    this.logger.verbose(this.postEmailLogin.name);
    const response = await this.service.loginOrThrow(body, false);
    return response;
  }

  @Post('email/register')
  @ApiOperation({
    summary: 'Create User and Authorize, note: tries to login first',
    operationId: 'postEmailRegister',
  })
  @ApiCreatedResponse({ type: AuthenticationResponse })
  @ApiOkResponse({ type: AuthenticationResponse })
  @ApiUnauthorizedResponse({
    description: 'If email already exists & invalid password',
    type: ErrorResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'If email already exists or needs Apple/Google',
    type: ErrorResponse,
  })
  async postEmailRegister(
    @Body() body: AuthenticationEmailRegisterRequestBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthenticationResponse> {
    this.logger.verbose(this.postEmailRegister.name);

    try {
      this.logger.verbose('Trying to login first');
      const result = await this.service.loginOrThrow(body, false);
      response.status(HttpStatus.OK);
      return result;
    } catch {
      this.logger.verbose('Failed, trying register');
      const result = await this.service.registerOrThrow(body);
      response.status(HttpStatus.CREATED);
      return result;
    }
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Confirm email',
    operationId: 'postEmailConfirm',
  })
  @ApiNoContentResponse()
  async postEmailConfirm(
    @Body() body: AuthenticationEmailConfirmRequestBody,
  ): Promise<void> {
    this.logger.verbose(this.postEmailConfirm.name);
    return this.service.confirmEmail(body.hash);
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Forgot password',
    operationId: 'postPasswordForgot',
  })
  @ApiNoContentResponse()
  async postPasswordForgot(
    @Body() body: AuthenticationPasswordForgotRequestBody,
  ): Promise<void> {
    this.logger.verbose(this.postPasswordForgot.name);
    return this.service.createForgotPasswordOrThrow(body.email);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset password',
    operationId: 'postPasswordReset',
  })
  @ApiNoContentResponse()
  postPasswordReset(
    @Body() body: AuthenticationPasswordResetRequestBody,
  ): Promise<void> {
    this.logger.verbose(this.postPasswordReset.name);
    return this.service.resetPassword(body.hash, body.password);
  }

  @ApiBearerAuth()
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh token',
    operationId: 'postRefresh',
  })
  @ApiOkResponse({ type: AuthenticationResponse })
  public postRefresh(
    @Req() request: any,
  ): Promise<Omit<AuthenticationResponse, 'user'>> {
    const { sessionId } = request.user;

    this.logger.verbose(this.postRefresh.name);
    const translations = this.translations();

    if (sessionId == undefined) {
      throw new UnauthorizedException(translations.sessionInvalid);
    }
    return this.service.refreshToken({ sessionId });
  }

  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete Session',
    operationId: 'deleteAuthMe',
  })
  @ApiNoContentResponse()
  public async deleteMe(@Req() request: JwtGuardedRequest): Promise<void> {
    const { sessionId } = request.user;

    this.logger.verbose(this.deleteMe.name);

    await this.service.logout({
      sessionId,
    });
  }

  @ApiBearerAuth()
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update password',
    operationId: 'patchAuthMe',
  })
  @ApiOkResponse({ type: UserEntity })
  @ApiBody({ type: AuthenticationUpdateRequestBody })
  public patchMe(
    @Req() request: JwtGuardedRequest,
    @Body() body: AuthenticationUpdateRequestBody,
  ): Promise<NullableType<UserEntity>> {
    this.logger.verbose(this.patchMe.name);
    return this.service.update(request.user, body);
  }
}
