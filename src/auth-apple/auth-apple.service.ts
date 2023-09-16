import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import appleSigninAuth from 'apple-signin-auth';
import { AllConfigType } from '../config.type.js';
import { SocialInterface } from '../social/interfaces/social.interface.js';
import { AuthAppleLoginDto } from './dto/auth-apple-login.dto.js';

@Injectable()
export class AuthAppleService {
  constructor(private configService: ConfigService<AllConfigType>) {}

  async getProfileByToken(
    loginDto: AuthAppleLoginDto,
  ): Promise<SocialInterface> {
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
