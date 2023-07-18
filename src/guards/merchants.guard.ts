import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { AuthService } from '../auth/auth.service';
import { MerchantsService } from '../merchants/merchants.service';

export interface MerchantsGuardedRequest extends Request {
  merchant: Merchant;
}

@Injectable()
export class MerchantsGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    @Inject(forwardRef(() => MerchantsService))
    private merchantsService: MerchantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
