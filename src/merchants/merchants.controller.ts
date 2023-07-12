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
import { UsersGuard } from 'src/auth/users.guard';
import { StripeCheckoutCreateInput } from 'src/merchants/dto/stripe-checkout-create.input';
import { SquareService } from 'src/square/square.service';
import { NullableType } from 'src/utils/types/nullable.type';
import { MerchantCreateInput } from './dto/create-merchant.input';
import { StripeCheckoutDto } from './dto/stripe-checkout.dto';
import { Merchant } from './entities/merchant.entity';
import { MerchantsGuard } from './merchants.guard';
import { MerchantsService } from './merchants.service';

@ApiTags('Merchant')
@Controller({
  path: 'merchant',
  version: '2',
})
export class MerchantsController {
  private readonly logger = new Logger(MerchantsController.name);

  constructor(
    protected readonly merchantsService: MerchantsService,
    @Inject(AuthService)
    protected readonly authService: AuthService,
    @Inject(SquareService)
    protected readonly squareService: SquareService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'input', required: true, type: MerchantCreateInput })
  @ApiOperation({ summary: 'Create Merchant for current User' })
  async create(@Req() request: any): Promise<Merchant> {
    const existing = await this.merchantsService.find({
      where: { userId: request.user.id },
    });
    if (existing.length > 0) {
      throw new UnauthorizedException(
        `Merchant with userId ${request.user.id} already exists`,
      );
    }
    return await this.merchantsService.save(
      this.merchantsService.create({ userId: request.user.id }),
    );
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Merchant })
  @ApiOperation({ summary: 'Get current Merchant' })
  public async me(@Req() request: any): Promise<Merchant> {
    return await request.merchant;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Post('me/square/login')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'oauthAccessCode', required: true, type: String })
  @ApiOperation({ summary: 'Confirm Square Oauth' })
  async squareConfirmOauth(
    @Req() request: any,
    @Query('oauthAccessCode') oauthAccessCode: string,
  ): Promise<Merchant | null> {
    return this.merchantsService.squareConfirmOauth({
      oauthAccessCode,
      merchant: request.merchant,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Get('me/square/catalog/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync your Square Catalog' })
  async squareCatalogSync(@Req() request: any): Promise<void> {
    return this.merchantsService.squareCatalogSync({
      merchant: request.merchant,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Get('me/square/locations/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync your Square Locations' })
  async squareLocationsSync(@Req() request: any): Promise<void> {
    await this.merchantsService.squareLocationsSync({
      merchant: request.merchant,
    });
    return;
  }

  @Post('me/stripe/checkout/create')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiBody({ type: StripeCheckoutCreateInput })
  @ApiOkResponse({ type: StripeCheckoutDto })
  @ApiOperation({ summary: 'Start Stripe checkout' })
  @HttpCode(HttpStatus.OK)
  async stripeCreateCheckoutSessionId(
    @Req() request,
    @Body() input: StripeCheckoutCreateInput,
  ): Promise<StripeCheckoutDto | null> {
    const checkoutSessionId =
      await this.merchantsService.stripeCreateCheckoutSessionId({
        merchant: request.merchant,
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
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Merchant })
  @ApiBody({ type: StripeCheckoutDto })
  @ApiOperation({ summary: 'Confirm Square checkout' })
  async stripeConfirmCheckoutSessionId(
    @Request() request,
    @Body()
    dto: StripeCheckoutDto,
  ): Promise<NullableType<Merchant>> {
    return this.merchantsService.stripeConfirmCheckoutSessionId({
      checkoutSessionId: dto.checkoutSessionId,
      merchant: request.merchant,
    });
  }
}
