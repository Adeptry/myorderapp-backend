import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
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
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { CategoryPaginatedResponse } from 'src/catalogs/dto/categories-paginated.output';
import {
  CategoryUpdateAllInput,
  CategoryUpdateInput,
} from 'src/catalogs/dto/category-update.dto';
import { ItemPaginatedResponse } from 'src/catalogs/dto/items-paginated.output';
import { Category } from 'src/catalogs/entities/category.entity';
import { CategoriesService } from 'src/catalogs/services/categories.service';
import { ItemsService } from 'src/catalogs/services/items.service';
import { CustomersService } from 'src/customers/customers.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { paginated } from 'src/utils/paginated';

@ApiTags('Catalogs')
@Controller({
  path: 'categories',
  version: '2',
})
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(
    private readonly service: CategoriesService,
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(ItemsService)
    private readonly itemsService: ItemsService,
    @Inject(MerchantsService)
    private readonly merchantsService: MerchantsService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CategoryPaginatedResponse })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'as', required: true, enum: UserTypeEnum })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiOperation({ summary: 'Get your Categories' })
  async categories(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('as') userType: UserTypeEnum,
    @Query('merchantId') merchantId?: string,
  ): Promise<CategoryPaginatedResponse> {
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
            `Merchant with userId ${user.id} not found`,
          );
        }

        if (!merchant.catalogId) {
          throw new NotFoundException(
            `Merchant ${merchant.id} has no catalogId`,
          );
        }

        return this.service.getManyCategories({
          catalogId: merchant.catalogId,
          onlyShowEnabled: false,
          pagination: { page, limit },
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

        return this.service.getManyCategories({
          catalogId: customersMerchant.catalogId,
          onlyShowEnabled: true,
          pagination: { page, limit },
        });
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/items')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ItemPaginatedResponse })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'as', required: true, enum: UserTypeEnum })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiOperation({ summary: 'Get items in Category' })
  async category(
    @Req() request: any,
    @Param('id') categoryId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('as') userType: UserTypeEnum,
    @Query('merchantId') merchantId?: string,
  ): Promise<ItemPaginatedResponse> {
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
            `Merchant with userId ${user.id} not found`,
          );
        }

        if (!merchant.catalogId) {
          throw new NotFoundException(
            `Merchant ${merchant.id} has no catalogId`,
          );
        }

        const merchantFindAndCount = await this.itemsService.findAndCount({
          where: { categoryId, catalogId: merchant.catalogId },
          order: { moaOrdinal: 'ASC' },
          take: limit,
          skip: (page - 1) * limit,
        });

        return paginated({
          data: merchantFindAndCount[0],
          count: merchantFindAndCount[1],
          pagination: { page, limit },
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

        const customerFindAndCount = await this.itemsService.findAndCount({
          where: {
            categoryId,
            catalogId: customersMerchant.catalogId,
            moaEnabled: true,
          },
          order: { moaOrdinal: 'ASC' },
          take: limit,
          skip: (page - 1) * limit,
        });
        return paginated({
          data: customerFindAndCount[0],
          count: customerFindAndCount[1],
          pagination: { page, limit },
        });
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @ApiOkResponse({ type: Category })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiOperation({ summary: 'Update a Category' })
  async update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() input: CategoryUpdateInput,
  ): Promise<Category> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const merchant = await this.merchantsService.findOne({
      where: { userId: user.id },
    });

    if (!merchant) {
      throw new UnauthorizedException(
        'Merchant object does not exist after successful authentication',
      );
    }

    return this.service.assignAndSave({
      id,
      input,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [Category] }) // array of Category
  @ApiBody({ type: [CategoryUpdateAllInput] })
  @ApiOperation({ summary: 'Update multiple Categories' })
  async updateMultiple(
    @Req() request: any,
    @Body() input: CategoryUpdateAllInput[],
  ): Promise<Category[]> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const merchant = await this.merchantsService.findOne({
      where: { userId: user.id },
    });

    if (!merchant) {
      throw new UnauthorizedException(
        'Merchant object does not exist after successful authentication',
      );
    }

    return await this.service.updateAll(input);
  }
}
