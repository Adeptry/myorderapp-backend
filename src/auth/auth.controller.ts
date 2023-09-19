import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  SerializeOptions,
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
} from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import { AppLogger } from '../logger/app.logger.js';
import { User } from '../users/entities/user.entity.js';
import { NullableType } from '../utils/types/nullable.type.js';
import { AuthService } from './auth.service.js';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto.js';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto.js';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto.js';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto.js';
import { AuthUpdateDto } from './dto/auth-update.dto.js';
import type { JwtGuardedRequest } from './strategies/jwt.strategy.js';
import { LoginResponseType } from './types/login-response.type.js';

@ApiTags('Auth')
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

  @SerializeOptions({
    groups: ['me'],
  })
  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get access token',
    operationId: 'login',
  })
  @ApiOkResponse({ type: LoginResponseType })
  async emailLogin(
    @Body() loginDto: AuthEmailLoginDto,
  ): Promise<LoginResponseType> {
    this.logger.verbose(this.emailLogin.name);
    const response = await this.service.validateLogin(loginDto, false);
    return response;
  }

  @Post('email/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create User and Authorize',
    operationId: 'register',
  })
  @ApiCreatedResponse({ type: LoginResponseType })
  async emailRegister(
    @Body() createUserDto: AuthRegisterLoginDto,
  ): Promise<LoginResponseType> {
    this.logger.verbose(this.emailRegister.name);
    const response = await this.service.register(createUserDto);
    return response;
  }

  // @Post('email/confirm')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @ApiOperation({
  //   summary: 'Confirm email',
  //   operationId: 'confirmEmail',
  // })
  // @ApiNoContentResponse()
  // async confirmEmail(
  //   @Body() confirmEmailDto: AuthConfirmEmailDto,
  // ): Promise<void> {
  //   return this.service.confirmEmail(confirmEmailDto.hash);
  // }

  @Post('forgot/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Forgot password',
    operationId: 'forgotPassword',
  })
  @ApiNoContentResponse()
  async forgotPassword(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
  ): Promise<void> {
    this.logger.verbose(this.forgotPassword.name);
    return this.service.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset password',
    operationId: 'resetPassword',
  })
  @ApiNoContentResponse()
  resetPassword(@Body() resetPasswordDto: AuthResetPasswordDto): Promise<void> {
    this.logger.verbose(this.resetPassword.name);
    return this.service.resetPassword(
      resetPasswordDto.hash,
      resetPasswordDto.password,
    );
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current Auth',
    operationId: 'currentAuth',
  })
  @ApiOkResponse({ type: User })
  public me(@Req() request: JwtGuardedRequest): Promise<NullableType<User>> {
    this.logger.verbose(this.me.name);
    return this.service.me(request.user);
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh token',
    operationId: 'refreshToken',
  })
  @ApiOkResponse({ type: LoginResponseType })
  public refresh(
    @Req() request: JwtGuardedRequest,
  ): Promise<Omit<LoginResponseType, 'user'>> {
    this.logger.verbose(this.refresh.name);
    if (request.user.sessionId == undefined) {
      throw new UnauthorizedException();
    }
    return this.service.refreshToken({ sessionId: request.user.sessionId });
  }

  @ApiBearerAuth()
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete Session',
    operationId: 'logout',
  })
  @ApiNoContentResponse()
  public async logout(@Req() request: JwtGuardedRequest): Promise<void> {
    this.logger.verbose(this.logout.name);
    await this.service.logout({
      sessionId: request.user.sessionId,
    });
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update password',
    operationId: 'updateCurrentAuth',
  })
  @ApiOkResponse({ type: User })
  @ApiBody({ type: AuthUpdateDto })
  public update(
    @Req() request: JwtGuardedRequest,
    @Body() userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    this.logger.verbose(this.update.name);
    return this.service.update(request.user, userDto);
  }

  // @ApiBearerAuth()
  // @Delete('me')
  // @UseGuards(AuthGuard('jwt'))
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @ApiOperation({
  //   summary: 'Delete User',
  //   operationId: 'deleteCurrentAuth',
  // })
  // @ApiNoContentResponse()
  // public async delete(@Req() request): Promise<void> {
  //   return this.service.softDelete(request.user);
  // }
}
