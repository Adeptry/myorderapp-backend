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
import { AuthService } from 'src/auth/auth.service';
import { LoginResponseType } from 'src/auth/types/login-response.type';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import { AuthGoogleService } from './auth-google.service';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto';

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
