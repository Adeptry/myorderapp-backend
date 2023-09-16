import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';

@Injectable()
export class AdminsGuard implements CanActivate {
  private readonly logger = new Logger(AdminsGuard.name);

  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('AdminsGuard canActivate');
    const request = context.switchToHttp().getRequest();
    const user = await this.authService.me(request.user);

    if (!(user?.role?.id === 'admin')) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    request.user = user;

    return true;
  }
}
