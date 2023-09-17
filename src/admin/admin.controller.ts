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
import { AuthService } from '../auth/auth.service.js';
import { AuthEmailLoginDto } from '../auth/dto/auth-email-login.dto.js';
import { LoginResponseType } from '../auth/types/login-response.type.js';
import { FilesService } from '../files/files.service.js';
import { AdminsGuard } from '../guards/admins.guard.js';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
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
  private readonly logger = new Logger(AdminController.name);

  constructor(
    protected readonly authService: AuthService,
    protected readonly filesService: FilesService,
    protected readonly merchantsSquareService: MerchantsSquareService,
  ) {}

  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get admin access token',
    operationId: 'adminLogin',
  })
  @ApiOkResponse({ type: LoginResponseType })
  public adminLogin(
    @Body() loginDTO: AuthEmailLoginDto,
  ): Promise<LoginResponseType> {
    return this.authService.validateLogin(loginDTO, true);
  }

  @Post('/square/catalog/sync')
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AdminsGuard)
  @ApiOperation({
    summary: 'Sync a merchants Square Catalog',
    operationId: 'syncMerchantSquareCatalog',
  })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  async squareCatalogSync(
    @Query('merchantId') merchantId: string,
  ): Promise<void> {
    return this.merchantsSquareService.sync({
      merchantId,
    });
  }
}
