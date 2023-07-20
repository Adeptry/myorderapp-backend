import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { LoginResponseType } from 'src/auth/types/login-response.type';
import { AuthFacebookService } from './auth-facebook.service';
import { AuthFacebookLoginDto } from './dto/auth-facebook-login.dto';

@ApiTags('Auth')
@Controller({
  path: 'auth/facebook',
  version: '2',
})
export class AuthFacebookController {
  constructor(
    private readonly authService: AuthService,
    private readonly authFacebookService: AuthFacebookService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Facebook login',
    operationId: 'loginFacebook',
  })
  @ApiOkResponse({ type: LoginResponseType })
  async login(
    @Body() loginDto: AuthFacebookLoginDto,
  ): Promise<LoginResponseType> {
    const socialData = await this.authFacebookService.getProfileByToken(
      loginDto,
    );

    return this.authService.validateSocialLogin(
      'facebook',
      socialData,
      loginDto.role,
    );
  }
}
