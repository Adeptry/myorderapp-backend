import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AuthenticationService } from '../../authentication/authentication.service.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { UserTypeEnum } from '../../users/dto/type-user.dto.js';
import { UserEntity } from '../../users/entities/user.entity.js';
import { CustomerEntity } from '../entities/customer.entity.js';
import { MerchantEntity } from '../entities/merchant.entity.js';
import { CustomersService } from '../services/customers.service.js';
import { MerchantsService } from '../services/merchants.service.js';

export interface UserTypeGuardedRequest extends Request {
  user: UserEntity;
  merchant: MerchantEntity;
  customer?: CustomerEntity;
}

@Injectable()
export class CustomerMerchantGuard implements CanActivate {
  private readonly logger = new Logger(CustomerMerchantGuard.name);

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly customersService: CustomersService,
    private readonly merchantsService: MerchantsService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  translations() {
    return this.i18n.t('moaSquare', {
      lang: I18nContext.current()?.lang,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(this.canActivate.name);
    const translations = this.translations();
    const request = context.switchToHttp().getRequest();
    const userType: UserTypeEnum = request.query.actingAs;
    const queryMerchantIdOrPath: string | undefined =
      request.query.merchantIdOrPath;

    const user = await this.authenticationService.me(request.user);

    if (!user?.id) {
      throw new UnauthorizedException(translations.usersNotFound);
    }

    if (userType === UserTypeEnum.merchant) {
      const merchant = await this.merchantsService.findOne({
        where: { userId: user.id },
      });
      if (!merchant) {
        throw new UnauthorizedException(translations.merchantsNotFound);
      }
      request.merchant = merchant;
    } else if (userType === UserTypeEnum.customer) {
      if (!queryMerchantIdOrPath) {
        throw new BadRequestException(translations.merchantIdOrPathRequired);
      }
      const customersMerchant = await this.merchantsService.findOneByIdOrPath({
        where: {
          idOrPath: queryMerchantIdOrPath,
        },
      });
      if (!customersMerchant?.id) {
        throw new UnauthorizedException(translations.merchantsNotFound);
      }
      request.merchant = customersMerchant;
      let customer = await this.customersService.findOne({
        where: { userId: user.id, merchantId: customersMerchant.id },
      });
      if (!customer) {
        customer = await this.customersService.createSaveAndSyncSquare({
          userId: user.id,
          merchantIdOrPath: customersMerchant.id,
        });
      }
      request.customer = customer;
    } else {
      throw new BadRequestException(translations.userTypeInvalid);
    }

    return true;
  }
}
