import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticationService } from '../authentication/authentication.service.js';
import { CustomersService } from '../customers/customers.service.js';
import { Customer } from '../customers/entities/customer.entity.js';
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
  private readonly logger = new Logger(CustomersGuard.name);

  constructor(
    private readonly service: CustomersService,
    private readonly merchantsService: MerchantsService,
    private readonly authenticationService: AuthenticationService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(this.canActivate.name);
    const request = context.switchToHttp().getRequest();
    const merchantIdOrPath: string | undefined = request.query.merchantIdOrPath;

    if (!merchantIdOrPath) {
      throw new UnauthorizedException(
        'Merchant ID or Path is required to access this endpoint',
      );
    }

    const user = await this.authenticationService.me(request.user);
    if (!user?.id) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const customer = await this.service.findOneWithUserIdAndMerchantIdOrPath({
      where: {
        userId: user.id,
        merchantIdOrPath,
      },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with userId ${user.id} and merchantId ${merchantIdOrPath} does not exist`,
      );
    }

    // Store customer object in request for later use
    request.customer = customer;

    const merchant = await this.merchantsService.findOneByIdOrPath({
      where: { idOrPath: merchantIdOrPath },
    });
    if (!merchant) {
      throw new NotFoundException(
        `Merchant with id ${merchantIdOrPath} does not exist`,
      );
    }
    if (!merchant.squareAccessToken) {
      throw new BadRequestException(
        `Merchant with id ${merchantIdOrPath} does not have a Square access token`,
      );
    }
    request.merchant = merchant;

    return true;
  }
}
