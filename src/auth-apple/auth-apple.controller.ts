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
import { AuthAppleService } from './auth-apple.service';
import { AuthAppleLoginDto } from './dto/auth-apple-login.dto';

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
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apple login',
    operationId: 'loginApple',
  })
  @ApiOkResponse({ type: LoginResponseType })
  async login(@Body() loginDto: AuthAppleLoginDto): Promise<LoginResponseType> {
    const socialData = await this.authAppleService.getProfileByToken(loginDto);

    return this.authService.validateSocialLogin(
      'apple',
      socialData,
      loginDto.role,
    );
  }
}
