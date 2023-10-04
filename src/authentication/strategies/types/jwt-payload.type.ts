import { SessionEntity } from '../../../session/entities/session.entity.js';
import { UserEntity } from '../../../users/entities/user.entity.js';

export type JwtPayloadType = Pick<UserEntity, 'id' | 'role'> & {
  sessionId: SessionEntity['id'];
  iat: number;
  exp: number;
};
