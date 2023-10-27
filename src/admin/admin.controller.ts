import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { InjectS3, type S3 } from 'nestjs-s3';
import path from 'path';
import { ApiKeyAuthGuard } from '../authentication/apikey-auth.guard.js';
import { AuthenticationService } from '../authentication/authentication.service.js';
import { AuthenticationEmailLoginRequestBody } from '../authentication/dto/authentication-email-login.dto.js';
import { AuthenticationResponse } from '../authentication/types/authentication-response.type.js';
import { AwsS3Config } from '../configs/aws-s3.config.js';
import { AppConfigService } from '../moa-square/services/app-config.service.js';
import { MerchantsSquareService } from '../moa-square/services/merchants.square.service.js';
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
    private readonly appConfigService: AppConfigService,
    @InjectS3()
    private readonly s3: S3,
    @Inject(AwsS3Config.KEY)
    protected awsS3Config: ConfigType<typeof AwsS3Config>,
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AdministratorsGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @Post('banner/upload')
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
  @ApiOperation({ summary: 'Upload banner', operationId: 'postBannerUpload' })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async postBannerUpload(
    @Query('merchantId') merchantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.verbose(this.postBannerUpload.name);

    const fileExtension = path.extname(file.originalname).toLowerCase();
    let contentType: string;

    if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (fileExtension === '.png') {
      contentType = 'image/png';
    } else {
      throw new BadRequestException('Invalid file type'); // You can customize this message
    }

    let appConfig = await this.appConfigService.findOne({
      where: { merchantId },
    });

    if (!appConfig) {
      appConfig = this.appConfigService.create({
        merchantId,
      });
    }

    const sanitizedFilename = file.originalname.replace(/[^\w\s.-]/g, '_');
    const key = `${encodeURIComponent(Date.now())}-${encodeURIComponent(
      sanitizedFilename,
    )}`;

    const { defaultBucket, region } = this.awsS3Config;

    try {
      await this.s3.putObject({
        Bucket: defaultBucket,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
        ContentDisposition: 'inline',
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }

    appConfig.bannerFileKey = key;
    appConfig.bannerFileFullUrl = `https://${defaultBucket}.s3.${region}.amazonaws.com/${key}`;
    appConfig.bannerFileDisplayName = file.originalname;
    appConfig.bannerFileContentType = contentType;

    return this.appConfigService.save(appConfig);
  }
}
