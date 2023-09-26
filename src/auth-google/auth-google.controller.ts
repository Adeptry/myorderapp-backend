import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../authentication/apikey-auth.guard.js';
import { AuthenticationService } from '../authentication/authentication.service.js';
import { AuthenticationResponse } from '../authentication/types/authentication-response.type.js';
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
  private readonly logger = new Logger(AuthGoogleController.name);

  constructor(
    private readonly authService: AuthenticationService,
    private readonly authGoogleService: AuthGoogleService,
  ) {
    this.logger.verbose(this.constructor.name);
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
