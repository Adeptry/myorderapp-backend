import { Session } from '../../../session/entities/session.entity.js';

export type JwtRefreshPayloadType = {
  sessionId: Session['id'];
  iat: number;
  exp: number;
};
