import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { CustomersService } from '../customers/customers.service.js';
import { Customer } from '../customers/entities/customer.entity.js';
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
    private readonly authService: AuthService,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @Inject(forwardRef(() => MerchantsService))
    private merchantsService: MerchantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userType: UserTypeEnum = request.query.actingAs;
    const merchantId: string = request.query.merchantId;

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
      if (!merchantId) {
        throw new BadRequestException(`merchantId is required`);
      }
      const customer = await this.customersService.findOne({
        where: { userId: user.id, merchantId },
      });
      if (!customer) {
        throw new UnauthorizedException(`Customer not found`);
      }
      request.customer = customer;
      const customersMerchant = await this.merchantsService.findOne({
        where: {
          id: merchantId,
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
