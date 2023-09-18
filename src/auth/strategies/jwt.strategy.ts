import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AllConfigType } from '../../config.type.js';
import { OrNeverType } from '../../utils/types/or-never.type.js';
import { JwtPayloadType } from './types/jwt-payload.type.js';

export interface JwtGuardedRequest extends Request {
  user: JwtPayloadType;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    private configService: ConfigService<AllConfigType>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.secret', { infer: true }),
    });
  }

  public validate(payload: JwtPayloadType): OrNeverType<JwtPayloadType> {
    if (!payload.id) {
      throw new UnauthorizedException();
    }

    return payload;
  }
}
