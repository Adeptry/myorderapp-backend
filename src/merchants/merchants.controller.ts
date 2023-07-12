import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  Post,
  Query,
  Req,
  Request,
  SerializeOptions,
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
import { AuthService } from 'src/auth/auth.service';
import { StripeCheckoutCreateInput } from 'src/merchants/dto/stripe-checkout-create.input';
import { SquareService } from 'src/square/square.service';
import { NullableType } from 'src/utils/types/nullable.type';
import { MerchantCreateInput } from './dto/create-merchant.input';
import { StripeCheckoutDto } from './dto/stripe-checkout.dto';
import { Merchant } from './entities/merchant.entity';
import { MerchantsService } from './merchants.service';

@ApiTags('Merchant')
@Controller({
  path: 'merchant',
  version: '2',
})
export class MerchantsController {
  private readonly logger = new Logger(MerchantsController.name);

  constructor(
    private readonly service: MerchantsService,
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(SquareService)
    private readonly squareService: SquareService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'input', required: true, type: MerchantCreateInput })
  @ApiOperation({ summary: 'Create Merchant for current User' })
  async create(@Req() request: any): Promise<Merchant | null> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const existing = await this.service.find({ where: { userId: user.id } });
    if (existing.length > 0) {
      throw new UnauthorizedException(
        `Merchant with userId ${user.id} already exists`,
      );
    }

    return await this.service.save(this.service.create({ userId: user.id }));
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Merchant })
  @ApiOperation({ summary: 'Get current Merchant' })
  public async me(@Req() request: any): Promise<NullableType<Merchant>> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const entity = await this.service.findOne({
      where: { userId: user.id },
    });

    if (!entity) {
      throw new UnauthorizedException(
        `Merchant with userId ${user.id} not found`,
      );
    }

    console.log(
      this.squareService.oauthUrl({
        scope: [
          'MERCHANT_PROFILE_READ',
          'CUSTOMERS_WRITE',
          'CUSTOMERS_READ',
          'ORDERS_WRITE',
          'ORDERS_READ',
          'PAYMENTS_READ',
          'PAYMENTS_WRITE',
          'PAYMENTS_WRITE_ADDITIONAL_RECIPIENTS',
          'ITEMS_WRITE',
          'ITEMS_READ',
        ],
        state: entity?.id,
      }),
    );

    return entity;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('me/square/login')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'oauthAccessCode', required: true, type: String })
  @ApiOperation({ summary: 'Confirm Square Oauth' })
  async squareConfirmOauth(
    @Req() request: any,
    @Query('oauthAccessCode') oauthAccessCode: string,
  ): Promise<Merchant | null> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    return this.service.squareConfirmOauth({
      oauthAccessCode,
      userId: user.id,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me/square/catalog/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync your Square Catalog' })
  async squareCatalogSync(@Req() request: any): Promise<void> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    await this.service.squareCatalogSync({
      userId: user.id,
    });

    return;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me/square/locations/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync your Square Locations' })
  async squareLocationsSync(@Req() request: any): Promise<void> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    await this.service.squareLocationsSync({
      userId: user.id,
    });

    return;
  }

  @Post('me/stripe/checkout/create')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiBody({ type: StripeCheckoutCreateInput })
  @ApiOkResponse({ type: StripeCheckoutDto })
  @ApiOperation({ summary: 'Start Stripe checkout' })
  @HttpCode(HttpStatus.OK)
  async stripeCreateCheckoutSessionId(
    @Request() request,
    @Body() input: StripeCheckoutCreateInput,
  ): Promise<StripeCheckoutDto | null> {
    this.logger.verbose(`Creating Stripe checkout session ${input.successUrl}`);
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const checkoutSessionId = await this.service.stripeCreateCheckoutSessionId({
      userId: user.id,
      ...input,
    });

    if (!checkoutSessionId) {
      throw new InternalServerErrorException(
        'Failed to create checkout session',
      );
    }

    return { checkoutSessionId };
  }

  @ApiBearerAuth()
  @Post('me/stripe/checkout/confirm')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Merchant })
  @ApiBody({ type: StripeCheckoutDto })
  @ApiOperation({ summary: 'Confirm Square checkout' })
  async stripeConfirmCheckoutSessionId(
    @Request() request,
    @Body()
    dto: StripeCheckoutDto,
  ): Promise<NullableType<Merchant>> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    return this.service.stripeConfirmCheckoutSessionId({
      checkoutSessionId: dto.checkoutSessionId,
      userId: user.id,
    });
  }
}
