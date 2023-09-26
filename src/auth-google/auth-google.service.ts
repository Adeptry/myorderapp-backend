import {
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { SocialInterface } from '../social/interfaces/social.interface.js';
import { AuthGoogleConfig } from './auth-google.config.js';
import { AuthGoogleLoginDto } from './dto/auth-google-login.dto.js';

@Injectable()
export class AuthGoogleService {
  private readonly logger = new Logger(AuthGoogleService.name);

  private google: OAuth2Client;

  constructor(
    @Inject(AuthGoogleConfig.KEY)
    private readonly config: ConfigType<typeof AuthGoogleConfig>,
  ) {
    this.logger.verbose(this.constructor.name);
    this.google = new OAuth2Client(config.clientId, config.clientSecret);
  }

  async getProfileByToken(
    loginDto: AuthGoogleLoginDto,
  ): Promise<SocialInterface> {
    this.logger.verbose(this.getProfileByToken.name);
    const ticket = await this.google.verifyIdToken({
      idToken: loginDto.idToken,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      audience: [this.config.clientId!],
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
