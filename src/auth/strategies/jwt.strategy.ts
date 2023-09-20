import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AllConfigType } from '../../config.type.js';
import { SessionService } from '../../session/session.service.js';
import { OrNeverType } from '../../utils/types/or-never.type.js';
import { JwtPayloadType } from './types/jwt-payload.type.js';

export interface JwtGuardedRequest extends Request {
  user: JwtPayloadType;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    protected configService: ConfigService<AllConfigType>,
    protected sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.secret', { infer: true }),
    });
  }

  public async validate(
    payload: JwtPayloadType,
  ): Promise<OrNeverType<JwtPayloadType>> {
    if (!payload.id) {
      throw new UnauthorizedException();
    }

    if (
      !(await this.sessionService.exist({ where: { id: payload.sessionId } }))
    ) {
      throw new UnauthorizedException();
    }

    return payload;
  }
}
