import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import appleSigninAuth from 'apple-signin-auth';
import { SocialInterface } from '../social/interfaces/social.interface.js';
import { AuthAppleConfig } from './auth-apple.config.js';
import { AuthAppleLoginDto } from './dto/auth-apple-login.dto.js';

@Injectable()
export class AuthAppleService {
  private readonly logger = new Logger(AuthAppleService.name);

  constructor(
    @Inject(AuthAppleConfig.KEY)
    private readonly config: ConfigType<typeof AuthAppleConfig>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  async getProfileByToken(
    loginDto: AuthAppleLoginDto,
  ): Promise<SocialInterface> {
    this.logger.verbose(this.getProfileByToken.name);
    const data = await appleSigninAuth.verifyIdToken(loginDto.idToken, {
      audience: this.config.appAudience,
    });

    return {
      id: data.sub,
      email: data.email,
      firstName: loginDto.firstName,
      lastName: loginDto.lastName,
    };
  }
}
