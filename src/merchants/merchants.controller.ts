import {
  BadRequestException,
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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersGuard } from 'src/guards/users.guard';
import { StripeCheckoutCreateInput } from 'src/merchants/dto/stripe-checkout-create.input';
import { SquareService } from 'src/square/square.service';
import { NestError } from 'src/utils/error';
import { NullableType } from 'src/utils/types/nullable.type';
import { MerchantsGuard } from '../guards/merchants.guard';
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
    protected readonly service: MerchantsService,
    @Inject(SquareService)
    protected readonly squareService: SquareService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'input', required: true, type: MerchantCreateInput })
  @ApiBadRequestResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOperation({
    summary: 'Create Merchant for current User',
    operationId: 'createMerchant',
  })
  async create(@Req() request: any): Promise<Merchant> {
    const existing = await this.service.find({
      where: { userId: request.user.id },
    });
    if (existing.length > 0) {
      throw new BadRequestException(
        `Merchant with userId ${request.user.id} already exists`,
      );
    }
    return await this.service.save(
      this.service.create({ userId: request.user.id }),
    );
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Merchant })
  @ApiOperation({
    summary: 'Get current Merchant',
    operationId: 'getMyMerchant',
  })
  public async me(@Req() request: any): Promise<Merchant> {
    return await request.merchant;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @Post('me/square/login')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'oauthAccessCode', required: true, type: String })
  @ApiOperation({
    summary: 'Confirm Square Oauth',
    operationId: 'confirmSquareOauth',
  })
  async squareConfirmOauth(
    @Req() request: any,
    @Query('oauthAccessCode') oauthAccessCode: string,
  ): Promise<Merchant | null> {
    return this.service.squareConfirmOauth({
      oauthAccessCode,
      merchant: request.merchant,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @Get('me/square/catalog/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync your Square Catalog',
    operationId: 'syncSquareCatalog',
  })
  async squareCatalogSync(@Req() request: any): Promise<void> {
    return this.service.squareCatalogSync({
      merchant: request.merchant,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @Get('me/square/locations/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync your Square Locations',
    operationId: 'syncSquareLocations',
  })
  async squareLocationsSync(@Req() request: any): Promise<void> {
    await this.service.squareLocationsSync({
      merchant: request.merchant,
    });
    return;
  }

  @Post('me/stripe/checkout/create')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiBody({ type: StripeCheckoutCreateInput })
  @ApiOkResponse({ type: StripeCheckoutDto })
  @ApiOperation({
    summary: 'Start Stripe checkout',
    operationId: 'startStripeCheckout',
  })
  @HttpCode(HttpStatus.OK)
  async stripeCreateCheckoutSessionId(
    @Req() request,
    @Body() input: StripeCheckoutCreateInput,
  ): Promise<StripeCheckoutDto | null> {
    const checkoutSessionId = await this.service.stripeCreateCheckoutSessionId({
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
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Merchant })
  @ApiBody({ type: StripeCheckoutDto })
  @ApiOperation({
    summary: 'Confirm Square checkout',
    operationId: 'confirmStripeCheckout',
  })
  async stripeConfirmCheckoutSessionId(
    @Request() request,
    @Body()
    dto: StripeCheckoutDto,
  ): Promise<NullableType<Merchant>> {
    return this.service.stripeConfirmCheckoutSessionId({
      checkoutSessionId: dto.checkoutSessionId,
      merchant: request.merchant,
    });
  }
}
