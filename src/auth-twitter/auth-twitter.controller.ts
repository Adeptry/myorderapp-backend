import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { LoginResponseType } from '../auth/types/login-response.type';
import { AuthTwitterService } from './auth-twitter.service';
import { AuthTwitterLoginDto } from './dto/auth-twitter-login.dto';

@ApiTags('Auth')
@Controller({
  path: 'auth/twitter',
  version: '1',
})
export class AuthTwitterController {
  constructor(
    private readonly authService: AuthService,
    private readonly authTwitterService: AuthTwitterService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: AuthTwitterLoginDto,
  ): Promise<LoginResponseType> {
    const socialData = await this.authTwitterService.getProfileByToken(
      loginDto,
    );

    return this.authService.validateSocialLogin(
      'twitter',
      socialData,
      loginDto.role,
    );
  }
}
