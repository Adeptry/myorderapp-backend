import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { AuthenticationService } from '../authentication/authentication.service.js';
import { CustomersService } from '../customers/customers.service.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { AppLogger } from '../logger/app.logger.js';
import { Merchant } from '../merchants/entities/merchant.entity.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { UserTypeEnum } from '../users/dto/type-user.dto.js';
import { User } from '../users/entities/user.entity.js';

export interface UserTypeGuardedRequest extends Request {
  user: User;
  merchant: Merchant;
  customer?: Customer;
}

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(
    private readonly authService: AuthenticationService,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @Inject(forwardRef(() => MerchantsService))
    private merchantsService: MerchantsService,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(UserTypeGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(this.canActivate.name);
    const request = context.switchToHttp().getRequest();
    const userType: UserTypeEnum = request.query.actingAs;
    const queryMerchantIdOrPath: string | undefined =
      request.query.merchantIdOrPath;

    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    if (userType === UserTypeEnum.merchant) {
      const merchant = await this.merchantsService.findOne({
        where: { userId: user.id },
      });
      if (!merchant) {
        throw new UnauthorizedException(
          'Merchant object does not exist after successful authentication',
        );
      }
      request.merchant = merchant;
    } else if (userType === UserTypeEnum.customer) {
      if (!queryMerchantIdOrPath) {
        throw new BadRequestException(`merchantId is required`);
      }
      const customer = await this.customersService.findOne({
        where: { userId: user.id },
      });
      if (!customer) {
        throw new UnauthorizedException(`Customer not found`);
      }
      request.customer = customer;
      const customersMerchant = await this.merchantsService.findOneByIdOrPath({
        where: {
          idOrPath: queryMerchantIdOrPath,
        },
      });
      if (!customersMerchant) {
        throw new UnauthorizedException(`Customer's Merchant not found`);
      }
      request.merchant = customersMerchant;
    } else {
      throw new BadRequestException(`Invalid user type`);
    }

    return true;
  }
}
