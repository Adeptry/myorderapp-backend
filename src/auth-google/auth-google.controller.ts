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
import { AuthGoogleService } from './auth-google.service.js';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto.js';

@ApiTags('Authentication')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'auth/google',
  version: '2',
})
export class AuthGoogleController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly authGoogleService: AuthGoogleService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthGoogleController.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Google login',
    operationId: 'postLoginGoogle',
  })
  @ApiOkResponse({ type: AuthenticationResponse })
  async postLogin(
    @Body() body: AuthGoogleLoginDto,
  ): Promise<AuthenticationResponse> {
    this.logger.verbose(this.postLogin.name);
    const socialData = await this.authGoogleService.getProfileByToken(body);

    return this.authService.validateSocialLogin(
      'google',
      socialData,
      body.role,
    );
  }
}
