import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { CustomersService } from 'src/customers/customers.service';
import { MerchantsService } from 'src/merchants/merchants.service';

@Injectable()
export class CustomersGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @Inject(forwardRef(() => MerchantsService))
    private merchantsService: MerchantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const merchantId = request.query.merchantId;

    const user = await this.authService.me(request.user);
    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const customer = await this.customersService.findOne({
      where: { userId: user.id, merchantId },
    });

    if (!customer) {
      throw new UnauthorizedException(
        `Customer with userId ${user.id} and merchantId ${merchantId} does not exist`,
      );
    }

    // Store customer object in request for later use
    request.customer = customer;

    const merchant = await this.merchantsService.findOne({
      where: { id: merchantId },
    });
    if (!merchant) {
      throw new UnauthorizedException(
        `Merchant with id ${merchantId} does not exist`,
      );
    }
    if (!merchant.squareAccessToken) {
      throw new UnauthorizedException(
        `Merchant with id ${merchantId} does not have a Square access token`,
      );
    }
    request.merchant = merchant;

    return true;
  }
}
