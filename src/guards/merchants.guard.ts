import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { AppLogger } from '../logger/app.logger.js';
import { Merchant } from '../merchants/entities/merchant.entity.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { User } from '../users/entities/user.entity.js';

export interface MerchantsGuardedRequest extends Request {
  merchant: Merchant;
  user: User;
}

@Injectable()
export class MerchantsGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    @Inject(forwardRef(() => MerchantsService))
    private merchantsService: MerchantsService,
    private readonly logger: AppLogger,
  ) {
    logger.setContext(MerchantsGuard.name);
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

    const merchant = await this.merchantsService.findOne({
      where: { userId: user.id },
    });
    if (!merchant) {
      throw new UnauthorizedException(
        `Merchant with userId ${user.id} does not exist`,
      );
    }

    // Store merchant object in request for later use
    request.merchant = merchant;
    return true;
  }
}
