import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticationService } from '../authentication/authentication.service.js';

@Injectable()
export class AdministratorsGuard implements CanActivate {
  private readonly logger = new Logger(AdministratorsGuard.name);

  constructor(private authenticationService: AuthenticationService) {
    this.logger.verbose(this.constructor.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(this.canActivate.name);
    const request = context.switchToHttp().getRequest();
    const user = await this.authenticationService.me(request.user);

    if (!(user?.role?.id === 'admin')) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    request.user = user;

    return true;
  }
}
