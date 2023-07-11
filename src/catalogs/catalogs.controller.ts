import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { CustomersService } from 'src/customers/customers.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { CatalogsService } from './catalogs.service';
import { Catalog } from './entities/catalog.entity';

@ApiTags('Catalogs')
@Controller({
  path: 'catalogs',
  version: '2',
})
export class CatalogsController {
  constructor(
    private readonly service: CatalogsService,
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(MerchantsService)
    private readonly merchantsService: MerchantsService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Catalog })
  @ApiQuery({ name: 'as', required: true, enum: UserTypeEnum })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiOperation({ summary: 'Get your catalog' })
  async catalog(
    @Req() request: any,
    @Query('as') userType: UserTypeEnum,
    @Query('merchantId') merchantId?: string,
  ): Promise<Catalog | null | undefined> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    switch (userType) {
      case UserTypeEnum.merchant:
        const merchant = await this.merchantsService.findOne({
          where: { userId: user.id },
        });

        if (!merchant) {
          throw new UnauthorizedException(
            'Merchant object does not exist after successful authentication',
          );
        }

        if (!merchant.catalogId) {
          throw new NotFoundException(
            `Merchant ${merchant.id} does not have a catalog`,
          );
        }

        return this.service.getOneOrderedOrFail({
          catalogId: merchant.catalogId,
          onlyShowEnabled: false,
        });
      case UserTypeEnum.customer:
        if (!merchantId) {
          throw new BadRequestException(`merchantId is required`);
        }

        const customer = await this.customersService.findOne({
          where: { userId: user.id, merchantId },
        });

        if (!customer) {
          throw new UnauthorizedException(`Customer not found`);
        }

        const customersMerchant = await this.customersService.loadOneMerchant(
          customer,
        );

        if (!customersMerchant || customersMerchant.id !== merchantId) {
          throw new UnauthorizedException(
            `Customer with that Merchant not found`,
          );
        }

        if (!customersMerchant.catalogId) {
          throw new NotFoundException(
            `Merchant ${customersMerchant.id} does not have a catalog`,
          );
        }

        return this.service.getOneOrderedOrFail({
          catalogId: customersMerchant.catalogId,
          onlyShowEnabled: true,
        });
    }
  }
}
