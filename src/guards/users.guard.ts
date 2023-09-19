import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { AppLogger } from '../logger/app.logger.js';
import { User } from '../users/entities/user.entity.js';

export interface UsersGuardedRequest extends Request {
  user: User;
}

@Injectable()
export class UsersGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(UsersGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(this.canActivate.name);
    const request = context.switchToHttp().getRequest();
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    // Store user object in request for later use
    request.user = user;

    return true;
  }
}
