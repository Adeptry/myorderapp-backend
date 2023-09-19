import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import appleSigninAuth from 'apple-signin-auth';
import { AllConfigType } from '../config.type.js';
import { AppLogger } from '../logger/app.logger.js';
import { SocialInterface } from '../social/interfaces/social.interface.js';
import { AuthAppleLoginDto } from './dto/auth-apple-login.dto.js';

@Injectable()
export class AuthAppleService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthAppleService.name);
  }

  async getProfileByToken(
    loginDto: AuthAppleLoginDto,
  ): Promise<SocialInterface> {
    this.logger.verbose(this.getProfileByToken.name);
    const data = await appleSigninAuth.verifyIdToken(loginDto.idToken, {
      audience: this.configService.get('apple.appAudience', { infer: true }),
    });

    return {
      id: data.sub,
      email: data.email,
      firstName: loginDto.firstName,
      lastName: loginDto.lastName,
    };
  }
}
