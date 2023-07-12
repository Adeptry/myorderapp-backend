import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Post,
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
import { Customer } from 'src/customers/entities/customer.entity';
import { MerchantCreateInput } from 'src/merchants/dto/create-merchant.input';
import { MerchantsService } from 'src/merchants/merchants.service';
import { NullableType } from 'src/utils/types/nullable.type';

@ApiTags('Customers')
@Controller({
  path: 'customers',
  version: '2',
})
export class CustomersController {
  constructor(
    private readonly service: CustomersService,
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(MerchantsService)
    private readonly merchantsService: MerchantsService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'input', required: true, type: MerchantCreateInput })
  @ApiOperation({ summary: 'Create Customer account for current User' })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  async create(@Req() request: any, @Query('merchantId') merchantId: string) {
    const user = await this.authService.me(request.user);

    if (!user?.id) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const merchant = await this.merchantsService.findOne({
      where: { id: merchantId },
    });
    if (!merchant?.id) {
      throw new InternalServerErrorException(`Merchant does not exist`);
    }

    return this.service.createAndSave({
      userId: user.id,
      merchantId: merchant.id,
    });
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Customer })
  @ApiOperation({ summary: 'Get current Customer' })
  public async me(
    @Req() request: any,
    @Query('merchantId') merchantId: string,
  ): Promise<NullableType<Customer>> {
    const user = await this.authService.me(request.user);
    const userId = user?.id;
    if (!userId) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const entity = await this.service.findOne({
      where: { userId, merchantId },
    });

    if (!entity) {
      throw new UnauthorizedException(
        `Customer with userId ${userId} not found`,
      );
    }

    return entity;
  }
}
