import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { CustomersService } from '../customers/customers.service.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { AppLogger } from '../logger/app.logger.js';
import { Merchant } from '../merchants/entities/merchant.entity.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { User } from '../users/entities/user.entity.js';

export interface CustomersGuardedRequest extends Request {
  user: User;
  customer: Customer;
  merchant: Merchant;
}

@Injectable()
export class CustomersGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @Inject(forwardRef(() => MerchantsService))
    private merchantsService: MerchantsService,
    private readonly logger: AppLogger,
  ) {
    logger.setContext(CustomersGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(this.canActivate.name);
    const request = context.switchToHttp().getRequest();
    const merchantId = request.query.merchantId;

    if (!merchantId) {
      throw new UnauthorizedException(
        'Merchant ID is required to access this endpoint',
      );
    }

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
