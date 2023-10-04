import { SessionEntity } from '../../../session/entities/session.entity.js';

export type JwtRefreshPayloadType = {
  sessionId: SessionEntity['id'];
  iat: number;
  exp: number;
};
