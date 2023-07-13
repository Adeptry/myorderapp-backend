import {
  BadRequestException,
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
import { UserTypeEnum } from 'src/users/dto/type-user.dts';

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
    const userType: UserTypeEnum = request.query.as;
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
