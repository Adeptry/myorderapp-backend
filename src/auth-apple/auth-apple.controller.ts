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
import { AuthenticationService } from '../authentication/authentication.service.js';
import { AuthenticationResponse } from '../authentication/types/authentication-response.type.js';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import { AppLogger } from '../logger/app.logger.js';
import { AuthAppleService } from './auth-apple.service.js';
import { AuthAppleLoginDto } from './dto/auth-apple-login.dto.js';

@ApiTags('Authentication')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'auth/apple',
  version: '2',
})
export class AuthAppleController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly authAppleService: AuthAppleService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthAppleController.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apple login',
    operationId: 'postLoginApple',
  })
  @ApiOkResponse({ type: AuthenticationResponse })
  async postLogin(
    @Body() body: AuthAppleLoginDto,
  ): Promise<AuthenticationResponse> {
    this.logger.verbose(this.postLogin.name);
    const socialData = await this.authAppleService.getProfileByToken(body);

    return this.authService.validateSocialLogin('apple', socialData, body.role);
  }
}
