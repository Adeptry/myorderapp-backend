import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticationService } from '../../authentication/authentication.service.js';
import { UserTypeEnum } from '../../users/dto/type-user.dto.js';
import { User } from '../../users/entities/user.entity.js';
import { Customer } from '../entities/customers/customer.entity.js';
import { MerchantEntity } from '../entities/merchants/merchant.entity.js';
import { CustomersService } from '../services/customers/customers.service.js';
import { MerchantsService } from '../services/merchants/merchants.service.js';

export interface UserTypeGuardedRequest extends Request {
  user: User;
  merchant: MerchantEntity;
  customer?: Customer;
}

@Injectable()
export class CustomerMerchantGuard implements CanActivate {
  private readonly logger = new Logger(CustomerMerchantGuard.name);

  constructor(
    private readonly service: CustomersService,
    private readonly authenticationService: AuthenticationService,
    private readonly merchantsService: MerchantsService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(this.canActivate.name);
    const request = context.switchToHttp().getRequest();
    const userType: UserTypeEnum = request.query.actingAs;
    const queryMerchantIdOrPath: string | undefined =
      request.query.merchantIdOrPath;

    const user = await this.authenticationService.me(request.user);

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
      const customer = await this.service.findOne({
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
