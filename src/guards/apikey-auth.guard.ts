import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppLogger } from '../logger/app.logger.js';

@Injectable()
export class ApiKeyAuthGuard extends AuthGuard('api-key') {
  constructor(private readonly logger: AppLogger) {
    logger.setContext(ApiKeyAuthGuard.name);
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    this.logger.verbose(this.canActivate.name);
    return super.canActivate(context);
  }
}
