import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service.js';
import { AuthEmailLoginDto } from '../auth/dto/auth-email-login.dto.js';
import { LoginResponseType } from '../auth/types/login-response.type.js';
import { FilesService } from '../files/files.service.js';
import { AdminsGuard } from '../guards/admins.guard.js';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { NestError } from '../utils/error.js';

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
    protected readonly merchantsService: MerchantsService,
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AdminsGuard)
  @Post('/upload/android')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiOperation({
    summary: 'Upload Android file',
    operationId: 'uploadAndroidFile',
  })
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
  })
  async uploadAndroidFile(
    @Query('merchantId') merchantId: string,
    @UploadedFile() file: Express.Multer.File | Express.MulterS3.File,
  ) {
    const merchant = await this.merchantsService.findOneOrFail({
      where: { id: merchantId },
    });
    merchant.androidZipFile = await this.filesService.uploadFile(file);
    await merchant.save();
    return;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AdminsGuard)
  @Post('/upload/ios')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiOperation({
    summary: 'Upload iOS file',
    operationId: 'uploadiOSFile',
  })
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
  })
  async uploadiOSFile(
    @Query('merchantId') merchantId: string,
    @UploadedFile() file: Express.Multer.File | Express.MulterS3.File,
  ) {
    const merchant = await this.merchantsService.findOneOrFail({
      where: { id: merchantId },
    });
    merchant.iosZipFile = await this.filesService.uploadFile(file);
    await merchant.save();
    return;
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
    return this.merchantsService.squareCatalogSync({
      merchantId,
    });
  }
}
