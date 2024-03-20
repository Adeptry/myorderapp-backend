/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { InjectS3, type S3 } from 'nestjs-s3';
import path from 'path';
import { Not } from 'typeorm';
import { ApiKeyAuthGuard } from '../../authentication/apikey-auth.guard.js';
import { AwsS3Config } from '../../configs/aws-s3.config.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { UserTypeEnum } from '../../users/dto/type-user.dto.js';
import { ErrorResponse } from '../../utils/error-response.js';
import { AppConfigUpdateBody } from '../dto/app-config-update.input.js';
import { AppConfigEntity } from '../entities/app-config.entity.js';
import type { UserTypeGuardedRequest } from '../guards/customer-merchant.guard.js';
import { CustomerMerchantGuard } from '../guards/customer-merchant.guard.js';
import type { MerchantsGuardedRequest } from '../guards/merchants.guard.js';
import { MerchantsGuard } from '../guards/merchants.guard.js';
import { AppConfigService } from '../services/app-config.service.js';

@ApiTags('AppConfigs')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'app-config',
  version: '2',
})
export class AppConfigController {
  private readonly logger = new Logger(AppConfigController.name);

  constructor(
    private readonly service: AppConfigService,
    private readonly i18n: I18nService<I18nTranslations>,
    @InjectS3()
    private readonly s3: S3,
    @Inject(AwsS3Config.KEY)
    protected awsS3Config: ConfigType<typeof AwsS3Config>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  currentLanguageTranslations() {
    return this.i18n.t('moaSquare', {
      lang: I18nContext.current()?.lang,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomerMerchantGuard)
  @ApiQuery({ name: 'merchantIdOrPath', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AppConfigEntity })
  @ApiNotFoundResponse({
    description: 'App config not found',
    type: ErrorResponse,
  })
  @ApiOperation({
    summary: 'Get your Config',
    operationId: 'getAppConfigMe',
  })
  async getMe(
    @Req() request: UserTypeGuardedRequest,
    @Query('merchantIdOrPath') merchantIdOrPath?: string,
  ) {
    this.logger.verbose(this.getMe.name);
    const translations = this.currentLanguageTranslations();
    const appConfig = await this.service.findOne({
      where: [
        { merchantId: merchantIdOrPath ?? request.merchant.id },
        { path: merchantIdOrPath },
      ],
    });

    if (!appConfig) {
      throw new NotFoundException(translations.appConfigsNotFound);
    }

    return appConfig;
  }

  @ApiBearerAuth()
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AppConfigEntity })
  @ApiNotFoundResponse({
    description: 'App config not found',
    type: ErrorResponse,
  })
  @ApiOperation({
    summary: 'Get Config for Merchant ID',
    operationId: 'getAppConfig',
  })
  async get(@Query('merchantIdOrPath') merchantIdOrPath: string) {
    this.logger.verbose(this.get.name);
    const translations = this.currentLanguageTranslations();
    const appConfig = await this.service.findOne({
      where: [{ merchantId: merchantIdOrPath }, { path: merchantIdOrPath }],
    });

    if (!appConfig) {
      throw new NotFoundException(translations.appConfigsNotFound);
    }

    return appConfig;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Post('me')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: AppConfigEntity })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'AppConfig already exists',
    type: ErrorResponse,
  })
  @ApiOperation({
    summary: 'Create your Config',
    operationId: 'postAppConfigMe',
  })
  @ApiBody({ type: AppConfigUpdateBody })
  @UseInterceptors(FileInterceptor('file'))
  async postMe(
    @Req() request: MerchantsGuardedRequest,
    @Body()
    body: AppConfigUpdateBody,
  ) {
    this.logger.verbose(this.postMe.name);
    const translations = this.currentLanguageTranslations();
    const { merchant } = request;

    if (!merchant?.id) {
      throw new UnauthorizedException(translations.merchantsNotFound);
    }

    if (await this.service.exist({ where: { merchantId: merchant.id } })) {
      throw new ConflictException(translations.appConfigsExists);
    }

    return this.service.save(
      this.service.create({
        merchantId: merchant.id,
        ...body,
      }),
    );
  }

  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AppConfigEntity })
  @ApiOperation({
    summary: 'Update your Config',
    operationId: 'patchAppConfigMe',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ErrorResponse })
  @ApiConflictResponse({ description: 'Conflict', type: ErrorResponse })
  @ApiBody({ type: AppConfigUpdateBody })
  async patchMe(
    @Req() request: MerchantsGuardedRequest,
    @Body() body: AppConfigUpdateBody,
  ) {
    this.logger.verbose(this.patchMe.name);
    const translations = this.currentLanguageTranslations();
    const { merchant } = request;

    if (!merchant?.id) {
      throw new UnauthorizedException(translations.merchantsNotFound);
    }

    let appConfig = await this.service.findOne({
      where: { merchantId: merchant.id },
    });

    if (!appConfig) {
      appConfig = this.service.create({
        merchantId: merchant.id,
      });
    }

    if (body.name != undefined) {
      if (
        await this.service.exist({
          where: {
            name: body.name,
            id: appConfig.id ? Not(appConfig.id) : undefined,
          },
        })
      ) {
        throw new ConflictException({
          message: translations.appConfigsNameExists,
          fields: {
            name: translations.appConfigsNameExists,
          },
        });
      }
    }

    Object.assign(appConfig, body);

    return this.service.save(appConfig);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @Post('me/icon/upload')
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
  @ApiOperation({ summary: 'Upload icon', operationId: 'postIconUploadMe' })
  async postIconUploadMe(
    @Req() request: MerchantsGuardedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.verbose(this.postIconUploadMe.name);
    const translations = this.currentLanguageTranslations();
    const { merchant } = request;

    if (!merchant?.id) {
      throw new UnauthorizedException(translations.merchantsNotFound);
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();
    let contentType: string;

    if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (fileExtension === '.png') {
      contentType = 'image/png';
    } else {
      throw new BadRequestException('Invalid file type'); // You can customize this message
    }

    let appConfig = await this.service.findOne({
      where: { merchantId: merchant.id },
    });

    if (!appConfig) {
      appConfig = this.service.create({
        merchantId: merchant.id,
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

    appConfig.iconFileKey = key;
    appConfig.iconFileFullUrl = `https://${defaultBucket}.s3.${region}.amazonaws.com/${key}`;
    appConfig.iconFileDisplayName = file.originalname;
    appConfig.iconFileContentType = contentType;

    return this.service.save(appConfig);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @Post('me/banner/upload')
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
  @ApiOperation({ summary: 'Upload banner', operationId: 'postBannerUploadMe' })
  async postBannerUploadMe(
    @Req() request: MerchantsGuardedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.verbose(this.postBannerUploadMe.name);
    const translations = this.currentLanguageTranslations();
    const { merchant } = request;

    if (!merchant?.id) {
      throw new UnauthorizedException(translations.merchantsNotFound);
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();
    let contentType: string;

    if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (fileExtension === '.png') {
      contentType = 'image/png';
    } else {
      throw new BadRequestException('Invalid file type'); // You can customize this message
    }

    let appConfig = await this.service.findOne({
      where: { merchantId: merchant.id },
    });

    if (!appConfig) {
      appConfig = this.service.create({
        merchantId: merchant.id,
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

    return this.service.save(appConfig);
  }
}
