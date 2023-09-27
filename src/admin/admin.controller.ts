import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
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
import { ApiKeyAuthGuard } from '../authentication/apikey-auth.guard.js';
import { AuthenticationService } from '../authentication/authentication.service.js';
import { AuthenticationEmailLoginRequestBody } from '../authentication/dto/authentication-email-login.dto.js';
import { AuthenticationResponse } from '../authentication/types/authentication-response.type.js';
import { MerchantsSquareService } from '../moa-square/services/merchants/merchants.square.service.js';
import { ErrorResponse } from '../utils/error-response.js';
import { AdministratorsGuard } from './administrators.guard.js';

@ApiTags('Admin')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'admin',
  version: '2',
})
export class AdminController {
  private readonly logger = new Logger(AdminController.name);
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly merchantsSquareService: MerchantsSquareService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get admin access token',
    operationId: 'postAdminEmailLogin',
  })
  @ApiOkResponse({ type: AuthenticationResponse })
  public postEmailLogin(
    @Body() body: AuthenticationEmailLoginRequestBody,
  ): Promise<AuthenticationResponse> {
    this.logger.verbose(this.postEmailLogin.name);
    return this.authenticationService.loginOrThrow(body, true);
  }

  @Post('/square/catalog/sync')
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AdministratorsGuard)
  @ApiOperation({
    summary: 'Sync a merchants Square Catalog',
    operationId: 'postAdminSquareCatalogSync',
  })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
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
