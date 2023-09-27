import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticationService } from '../../authentication/authentication.service.js';
import { User } from '../../users/entities/user.entity.js';
import { MerchantEntity } from '../entities/merchants/merchant.entity.js';
import { MerchantsService } from '../services/merchants/merchants.service.js';

export interface MerchantsGuardedRequest extends Request {
  merchant: MerchantEntity;
  user: User;
}

@Injectable()
export class MerchantsGuard implements CanActivate {
  private readonly logger = new Logger(MerchantsGuard.name);

  constructor(
    private readonly service: MerchantsService,
    private readonly authService: AuthenticationService,
  ) {
    this.logger.verbose(this.constructor.name);
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

    const merchant = await this.service.findOne({
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
