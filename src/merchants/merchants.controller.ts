import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Request,
  SerializeOptions,
  UnauthorizedException,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { NullableType } from 'src/utils/types/nullable.type';
import { SquareConfirmOauthDto } from './dto/square-confirm-oauth.input';
import { StripeConfirmCheckoutSessionIdDto } from './dto/stripe-confirm-checkout.input';
import { MoaMerchant } from './entities/merchant.entity';
import { MerchantsService } from './merchants.service';

@ApiTags('Merchant')
@Controller({
  path: 'merchant',
  version: '2',
})
export class MerchantsController {
  constructor(
    private readonly service: MerchantsService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MoaMerchant })
  public async me(@Request() request): Promise<NullableType<MoaMerchant>> {
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

    return entity;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('square/login')
  @HttpCode(HttpStatus.OK)
  async squareConfirmOauth(
    @Req() request: any,
    @Body() squareConfirmOauthDto: SquareConfirmOauthDto,
  ): Promise<MoaMerchant | null> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    return this.service.squareConfirmOauth({
      oauthAccessCode: squareConfirmOauthDto.oauthAccessCode,
      userId: user.id,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('square/sync')
  @HttpCode(HttpStatus.OK)
  async squareSync(@Req() request: any): Promise<void> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    await this.service.squareSync({
      userId: user.id,
    });

    return;
  }

  @ApiBearerAuth()
  @Post('stripe/create')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: String })
  async stripeCreateCheckoutSessionId(
    @Request() request,
  ): Promise<string | null> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    return this.service.stripeCreateCheckoutSessionId({
      userId: user.id,
    });
  }

  @ApiBearerAuth()
  @Post('stripe/confirm')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MoaMerchant })
  async stripeConfirmCheckoutSessionId(
    @Request() request,
    @Body()
    stripeConfirmCheckoutSessionIdDto: StripeConfirmCheckoutSessionIdDto,
  ): Promise<NullableType<MoaMerchant>> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    return this.service.stripeConfirmCheckoutSessionId({
      checkoutSessionId: stripeConfirmCheckoutSessionIdDto.checkoutSessionId,
      userId: user.id,
    });
  }
}
