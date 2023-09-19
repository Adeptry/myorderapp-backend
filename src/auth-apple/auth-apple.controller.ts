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
import { AppLogger } from '../logger/app.logger.js';
import { AuthAppleService } from './auth-apple.service.js';
import { AuthAppleLoginDto } from './dto/auth-apple-login.dto.js';

@ApiTags('Auth')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'auth/apple',
  version: '2',
})
export class AuthAppleController {
  constructor(
    private readonly authService: AuthService,
    private readonly authAppleService: AuthAppleService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthAppleController.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apple login',
    operationId: 'loginApple',
  })
  @ApiOkResponse({ type: LoginResponseType })
  async login(@Body() loginDto: AuthAppleLoginDto): Promise<LoginResponseType> {
    this.logger.verbose(this.login.name);
    const socialData = await this.authAppleService.getProfileByToken(loginDto);

    return this.authService.validateSocialLogin(
      'apple',
      socialData,
      loginDto.role,
    );
  }
}
