import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { OrNeverType } from '../../utils/or-never.type.js';
import { AuthenticationConfig } from '../authentication.config.js';
import { JwtRefreshPayloadType } from './types/jwt-refresh-payload.type.js';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    @Inject(AuthenticationConfig.KEY)
    protected readonly config: ConfigType<typeof AuthenticationConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.refreshSecret,
    });
    this.logger.verbose(this.constructor.name);
  }

  public validate(
    payload: JwtRefreshPayloadType,
  ): OrNeverType<JwtRefreshPayloadType> {
    this.logger.verbose(this.validate.name);
    if (!payload.sessionId) {
      this.logger.verbose('No session ID');
      throw new UnauthorizedException();
    }

    this.logger.verbose('Found payload');
    return payload;
  }
}
