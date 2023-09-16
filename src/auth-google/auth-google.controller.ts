import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service.js';
import { LoginResponseType } from '../auth/types/login-response.type.js';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import { AuthGoogleService } from './auth-google.service.js';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto.js';

@ApiTags('Auth')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'auth/google',
  version: '2',
})
export class AuthGoogleController {
  constructor(
    private readonly authService: AuthService,
    private readonly authGoogleService: AuthGoogleService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Google login',
    operationId: 'loginGoogle',
  })
  @ApiOkResponse({ type: LoginResponseType })
  async login(
    @Body() loginDto: AuthGoogleLoginDto,
  ): Promise<LoginResponseType> {
    const socialData = await this.authGoogleService.getProfileByToken(loginDto);

    return this.authService.validateSocialLogin(
      'google',
      socialData,
      loginDto.role,
    );
  }
}
