import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service.js';
import { AuthEmailLoginDto } from '../auth/dto/auth-email-login.dto.js';
import { LoginResponseType } from '../auth/types/login-response.type.js';
import { AdminsGuard } from '../guards/admins.guard.js';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import { AppLogger } from '../logger/app.logger.js';
import { MerchantsSquareService } from '../merchants/merchants.square.service.js';
import { NestError } from '../utils/error.js';

@ApiTags('Admin')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'admin',
  version: '2',
})
export class AdminController {
  constructor(
    private readonly authService: AuthService,
    private readonly merchantsSquareService: MerchantsSquareService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AdminController.name);
  }

  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get admin access token',
    operationId: 'postAdminEmailLogin',
  })
  @ApiOkResponse({ type: LoginResponseType })
  public postEmailLogin(
    @Body() loginDTO: AuthEmailLoginDto,
  ): Promise<LoginResponseType> {
    this.logger.verbose(this.postEmailLogin.name);
    return this.authService.validateLogin(loginDTO, true);
  }

  @Post('/square/catalog/sync')
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AdminsGuard)
  @ApiOperation({
    summary: 'Sync a merchants Square Catalog',
    operationId: 'postAdminSquareCatalogSync',
  })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  async squareCatalogSync(
    @Query('merchantId') merchantId: string,
  ): Promise<void> {
    this.logger.verbose(this.squareCatalogSync.name);
    return this.merchantsSquareService.sync({
      merchantId,
    });
  }
}
