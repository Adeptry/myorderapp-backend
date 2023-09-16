import { Session } from '../../../session/entities/session.entity.js';
import { User } from '../../../users/entities/user.entity.js';

export type JwtPayloadType = Pick<User, 'id' | 'role'> & {
  sessionId: Session['id'];
  iat: number;
  exp: number;
};
