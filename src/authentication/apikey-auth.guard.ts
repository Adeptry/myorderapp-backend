import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ApiKeyAuthGuard extends AuthGuard('api-key') {
  private readonly logger = new Logger(ApiKeyAuthGuard.name);

  constructor() {
    super();
    this.logger.verbose(this.constructor.name);
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    this.logger.verbose(this.canActivate.name);
    return super.canActivate(context);
  }
}
