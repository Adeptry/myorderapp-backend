import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AllConfigType } from '../config.type.js';
import { AppLogger } from '../logger/app.logger.js';
import { SocialInterface } from '../social/interfaces/social.interface.js';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto.js';

@Injectable()
export class AuthGoogleService {
  private google: OAuth2Client;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthGoogleService.name);
    this.google = new OAuth2Client(
      configService.get('google.clientId', { infer: true }),
      configService.get('google.clientSecret', { infer: true }),
    );
  }

  async getProfileByToken(
    loginDto: AuthGoogleLoginDto,
  ): Promise<SocialInterface> {
    this.logger.verbose(this.getProfileByToken.name);
    const ticket = await this.google.verifyIdToken({
      idToken: loginDto.idToken,
      audience: [
        this.configService.getOrThrow('google.clientId', { infer: true }),
      ],
    });

    const data = ticket.getPayload();

    if (!data) {
      throw new UnprocessableEntityException(`Incorrect token`);
    }

    return {
      id: data.sub,
      email: data.email,
      firstName: data.given_name,
      lastName: data.family_name,
    };
  }
}
