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
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AuthenticationService } from '../../authentication/authentication.service.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { UserEntity } from '../../users/entities/user.entity.js';
import { CustomerEntity } from '../entities/customer.entity.js';
import { MerchantEntity } from '../entities/merchant.entity.js';
import { CustomersService } from '../services/customers.service.js';
import { MerchantsService } from '../services/merchants.service.js';

export interface CustomersGuardedRequest extends Request {
  user: UserEntity;
  customer: CustomerEntity;
  merchant: MerchantEntity;
}

@Injectable()
export class CustomersGuard implements CanActivate {
  private readonly logger = new Logger(CustomersGuard.name);

  constructor(
    private readonly service: CustomersService,
    private readonly merchantsService: MerchantsService,
    private readonly authenticationService: AuthenticationService,
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
    const request = context.switchToHttp().getRequest();
    const merchantIdOrPath: string | undefined = request.query.merchantIdOrPath;
    const translations = this.translations();

    if (!merchantIdOrPath) {
      throw new UnauthorizedException(translations.merchantIdOrPathRequired);
    }

    const user = await this.authenticationService.me(request.user);
    if (!user?.id) {
      throw new UnauthorizedException(translations.usersNotFound);
    }

    const customer = await this.service.findOneWithUserIdAndMerchantIdOrPath({
      where: {
        userId: user.id,
        merchantIdOrPath,
      },
    });

    if (!customer) {
      throw new NotFoundException(translations.customersNotFound);
    }

    // Store customer object in request for later use
    request.customer = customer;

    const merchant = await this.merchantsService.findOneByIdOrPath({
      where: { idOrPath: merchantIdOrPath },
    });
    if (!merchant) {
      throw new NotFoundException(translations.merchantsNotFound);
    }
    if (!merchant.squareAccessToken) {
      throw new BadRequestException(
        translations.merchantsSquareAccessTokenNotFound,
      );
    }
    request.merchant = merchant;

    return true;
  }
}
