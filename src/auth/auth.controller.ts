import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Request,
  SerializeOptions,
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
  ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { NullableType } from 'src/utils/types/nullable.type';
import { AuthService } from './auth.service';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { LoginResponseType } from './types/login-response.type';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '2',
})
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly service: AuthService) {}

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
  public login(
    @Body() loginDto: AuthEmailLoginDto,
  ): Promise<LoginResponseType> {
    this.logger.log(JSON.stringify(loginDto));
    return this.service.validateLogin(loginDto, false);
  }

  // @SerializeOptions({
  //   groups: ['me'],
  // })
  // @Post('admin/email/login')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({
  //   summary: 'Get admin access token',
  //   operationId: 'adminLogin',
  // })
  // @ApiOkResponse({ type: LoginResponseType })
  // public adminLogin(
  //   @Body() loginDTO: AuthEmailLoginDto,
  // ): Promise<LoginResponseType> {
  //   return this.service.validateLogin(loginDTO, true);
  // }

  @Post('email/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Auth',
    operationId: 'register',
  })
  @ApiCreatedResponse({ type: LoginResponseType })
  async register(
    @Body() createUserDto: AuthRegisterLoginDto,
  ): Promise<LoginResponseType> {
    return this.service.register(createUserDto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Confirm email',
    operationId: 'confirmEmail',
  })
  @ApiNoContentResponse()
  async confirmEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    return this.service.confirmEmail(confirmEmailDto.hash);
  }

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
  public me(@Request() request): Promise<NullableType<User>> {
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
  public refresh(@Request() request): Promise<Omit<LoginResponseType, 'user'>> {
    return this.service.refreshToken(request.user.sessionId);
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
  public async logout(@Request() request): Promise<void> {
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
    summary: 'Update Auth',
    operationId: 'updateCurrentAuth',
  })
  @ApiOkResponse({ type: User })
  @ApiBody({ type: AuthUpdateDto })
  public update(
    @Request() request,
    @Body() userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    this.logger.verbose(
      `Update user ${request.user.id} ${JSON.stringify(userDto)}`,
    );
    return this.service.update(request.user, userDto);
  }

  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete User',
    operationId: 'deleteCurrentAuth',
  })
  @ApiNoContentResponse()
  public async delete(@Request() request): Promise<void> {
    return this.service.softDelete(request.user);
  }
}
