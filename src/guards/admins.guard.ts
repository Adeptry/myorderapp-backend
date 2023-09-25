import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticationService } from '../authentication/authentication.service.js';
import { AppLogger } from '../logger/app.logger.js';

@Injectable()
export class AdminsGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(AdminsGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(this.canActivate.name);
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
