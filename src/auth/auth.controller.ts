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
  Req,
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
    operationId: 'createSession',
  })
  @ApiOkResponse({ type: LoginResponseType })
  async login(@Body() loginDto: AuthEmailLoginDto): Promise<LoginResponseType> {
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
    operationId: 'createUser',
  })
  @ApiCreatedResponse({ type: LoginResponseType })
  async register(
    @Body() createUserDto: AuthRegisterLoginDto,
  ): Promise<LoginResponseType> {
    return this.service.register(createUserDto);
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
  public me(@Req() request): Promise<NullableType<User>> {
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
  public refresh(@Req() request): Promise<Omit<LoginResponseType, 'user'>> {
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
  public async logout(@Req() request): Promise<void> {
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
    @Req() request,
    @Body() userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
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
  public async delete(@Req() request): Promise<void> {
    return this.service.softDelete(request.user);
  }
}
