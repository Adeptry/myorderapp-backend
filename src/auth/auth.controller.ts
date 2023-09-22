import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
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
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import { AppLogger } from '../logger/app.logger.js';
import { User } from '../users/entities/user.entity.js';
import { ErrorResponse } from '../utils/error-response.js';
import { NullableType } from '../utils/types/nullable.type.js';
import { AuthService } from './auth.service.js';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto.js';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto.js';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto.js';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto.js';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto.js';
import { AuthUpdateDto } from './dto/auth-update.dto.js';
import type { JwtGuardedRequest } from './strategies/jwt.strategy.js';
import { LoginResponseType } from './types/login-response.type.js';

@ApiTags('Authentication')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'auth',
  version: '2',
})
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthController.name);
  }

  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get access token',
    operationId: 'postEmailLogin',
  })
  @ApiOkResponse({ type: LoginResponseType })
  @ApiUnauthorizedResponse({
    description: 'For invalid email/password',
    type: ErrorResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'If wrong provider, e.g. needs Apple/Google',
    type: ErrorResponse,
  })
  async postEmailLogin(
    @Body() loginDto: AuthEmailLoginDto,
  ): Promise<LoginResponseType> {
    this.logger.verbose(this.postEmailLogin.name);
    const response = await this.service.loginOrThrow(loginDto, false);
    return response;
  }

  @Post('email/register')
  @ApiOperation({
    summary: 'Create User and Authorize, note: tries to login first',
    operationId: 'postEmailRegister',
  })
  @ApiCreatedResponse({ type: LoginResponseType })
  @ApiOkResponse({ type: LoginResponseType })
  @ApiUnauthorizedResponse({
    description: 'If email already exists & invalid password',
    type: ErrorResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'If email already exists or needs Apple/Google',
    type: ErrorResponse,
  })
  async postEmailRegister(
    @Body() createUserDto: AuthRegisterLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseType> {
    this.logger.verbose(this.postEmailRegister.name);

    try {
      this.logger.verbose('Trying to login first');
      const result = await this.service.loginOrThrow(createUserDto, false);
      response.status(HttpStatus.OK);
      return result;
    } catch {
      this.logger.verbose('Failed, trying register');
      const result = await this.service.registerOrThrow(createUserDto);
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
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    this.logger.verbose(this.postEmailConfirm.name);
    return this.service.confirmEmail(confirmEmailDto.hash);
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Forgot password',
    operationId: 'postPasswordForgot',
  })
  @ApiNoContentResponse()
  async postPasswordForgot(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
  ): Promise<void> {
    this.logger.verbose(this.postPasswordForgot.name);
    return this.service.createForgotPasswordOrThrow(forgotPasswordDto.email);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset password',
    operationId: 'postPasswordReset',
  })
  @ApiNoContentResponse()
  postPasswordReset(
    @Body() resetPasswordDto: AuthResetPasswordDto,
  ): Promise<void> {
    this.logger.verbose(this.postPasswordReset.name);
    return this.service.resetPassword(
      resetPasswordDto.hash,
      resetPasswordDto.password,
    );
  }

  @ApiBearerAuth()
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh token',
    operationId: 'postRefresh',
  })
  @ApiOkResponse({ type: LoginResponseType })
  public postRefresh(
    @Req() request: JwtGuardedRequest,
  ): Promise<Omit<LoginResponseType, 'user'>> {
    this.logger.verbose(this.postRefresh.name);
    if (request.user.sessionId == undefined) {
      throw new UnauthorizedException();
    }
    return this.service.refreshToken({ sessionId: request.user.sessionId });
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
    this.logger.verbose(this.deleteMe.name);
    await this.service.logout({
      sessionId: request.user.sessionId,
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
  @ApiOkResponse({ type: User })
  @ApiBody({ type: AuthUpdateDto })
  public patchMe(
    @Req() request: JwtGuardedRequest,
    @Body() userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    this.logger.verbose(this.patchMe.name);
    return this.service.update(request.user, userDto);
  }
}
