import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AppConfigService } from 'src/app-config/app-config.service';
import { AuthService } from 'src/auth/auth.service';
import { CustomersService } from 'src/customers/customers.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { ConfigUpdateInput } from './dto/app-config-update.input';
import { AppConfig } from './entities/app-config.entity';

@ApiTags('Config')
@Controller({
  path: 'config',
  version: '2',
})
export class AppConfigController {
  constructor(
    private readonly service: AppConfigService,
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
  @ApiOkResponse({ type: AppConfig })
  @ApiQuery({ name: 'as', required: true, enum: UserTypeEnum })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiOperation({ summary: 'Get your App Config' })
  async get(
    @Req() request: any,
    @Query('as') userType: UserTypeEnum,
    @Query('merchantId') merchantId?: string,
  ) {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    switch (userType) {
      case UserTypeEnum[UserTypeEnum.merchant]:
        const merchant = await this.merchantsService.findOne({
          where: { userId: user.id },
        });
        if (!merchant?.id) {
          throw new UnauthorizedException(
            `Merchant with userId ${user.id} not found`,
          );
        }
        const merchantsEntity = await this.service.findOne({
          where: { merchantId: merchant.id },
        });
        if (!merchantsEntity?.id) {
          throw new NotFoundException(`AppConfig not found`);
        }
        return merchantsEntity;
      case UserTypeEnum[UserTypeEnum.customer]:
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

        const customersEntity = await this.service.findOne({
          where: { merchantId },
        });
        if (!customersEntity?.id) {
          throw new NotFoundException(`AppConfig not found`);
        }
        return customersEntity;
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('me')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create AppConfig' })
  @ApiBody({ type: ConfigUpdateInput })
  async create(
    @Req() request: any,
    @Body()
    createAppConfigDto: ConfigUpdateInput,
  ) {
    const user = await this.authService.me(request.user);
    const userId = user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const merchant = await this.merchantsService.findOne({
      where: { userId },
    });
    const merchantId = merchant?.id;

    if (!merchantId) {
      throw new UnauthorizedException(
        `Merchant with user id ${userId} not found or not belongs to current user`,
      );
    }

    return this.service.save(
      this.service.create({
        merchantId,
        ...createAppConfigDto,
      }),
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update AppConfig' })
  @ApiBody({ type: ConfigUpdateInput })
  async update(
    @Req() request: any,
    @Body() updateAppConfigDto: ConfigUpdateInput,
  ) {
    const user = await this.authService.me(request.user);
    const userId = user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const merchant = await this.merchantsService.findOne({
      where: { userId },
    });
    const merchantId = merchant?.id;

    if (!merchantId) {
      throw new UnauthorizedException(
        `Merchant with user id ${userId} not found or not belongs to current user`,
      );
    }

    const entity = await this.service.findOne({ where: { merchantId } });
    if (!entity?.id) {
      throw new UnauthorizedException(
        `AppConfig with merchant id ${merchantId} not found`,
      );
    }

    Object.assign(entity, updateAppConfigDto);

    return this.service.save(entity);
  }
}
