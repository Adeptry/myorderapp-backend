import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { Not, QueryFailedError } from 'typeorm';
import { AppConfigService } from '../app-config/app-config.service.js';
import { ApiKeyAuthGuard } from '../authentication/apikey-auth.guard.js';
import { AwsS3FilesService } from '../aws-s3-files/aws-s3-files.service.js';
import type { UserTypeGuardedRequest } from '../customers/customer-merchant.guard.js';
import { CustomerMerchantGuard } from '../customers/customer-merchant.guard.js';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import type { MerchantsGuardedRequest } from '../merchants/merchants.guard.js';
import { MerchantsGuard } from '../merchants/merchants.guard.js';
import { UserTypeEnum } from '../users/dto/type-user.dto.js';
import { ErrorResponse } from '../utils/error-response.js';
import { AppConfigUpdateDto } from './dto/app-config-update.input.js';
import { AppConfig } from './entities/app-config.entity.js';

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
    private readonly filesService: AwsS3FilesService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  currentLanguageTranslations() {
    return this.i18n.t('app-config', {
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
  @ApiOkResponse({ type: AppConfig })
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
      throw new NotFoundException(translations.notFound);
    }

    return appConfig;
  }

  @ApiBearerAuth()
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AppConfig })
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
      throw new NotFoundException(translations.notFound);
    }

    return appConfig;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Post('me')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: AppConfig })
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
  @ApiBody({ type: AppConfigUpdateDto })
  @UseInterceptors(FileInterceptor('file'))
  async postMe(
    @Req() request: MerchantsGuardedRequest,
    @Body()
    createAppConfigDto: AppConfigUpdateDto,
  ) {
    this.logger.verbose(this.postMe.name);
    const translations = this.currentLanguageTranslations();
    const { merchant } = request;

    if (!merchant?.id) {
      throw new UnauthorizedException(translations.notFound);
    }

    if (await this.service.exist({ where: { merchantId: merchant.id } })) {
      throw new ConflictException(translations.alreadyExists);
    }

    try {
      return this.service.save(
        this.service.create({
          merchantId: merchant.id,
          ...createAppConfigDto,
        }),
      );
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException(error.message);
      } else if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      } else {
        throw new InternalServerErrorException(error);
      }
    }
  }

  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AppConfig })
  @ApiOperation({
    summary: 'Update your Config',
    operationId: 'patchAppConfigMe',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ErrorResponse })
  @ApiConflictResponse({ description: 'Conflict', type: ErrorResponse })
  @ApiBody({ type: AppConfigUpdateDto })
  async patchMe(
    @Req() request: MerchantsGuardedRequest,
    @Body() body: AppConfigUpdateDto,
  ) {
    this.logger.verbose(this.patchMe.name);
    const translations = this.currentLanguageTranslations();
    const { merchant } = request;

    if (!merchant?.id) {
      throw new UnauthorizedException(translations.unauthorized);
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
          message: translations.nameAlreadyExists,
          fields: {
            name: translations.nameNeedsToBeUnique,
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
  @UseInterceptors(FileInterceptor('file')) // 1
  @ApiOperation({ summary: 'Upload icon', operationId: 'postIconUploadMe' })
  async postIconUploadMe(
    @Req() request: MerchantsGuardedRequest,
    @UploadedFile() file: Express.Multer.File | Express.MulterS3.File,
  ) {
    this.logger.verbose(this.postIconUploadMe.name);
    const translations = this.currentLanguageTranslations();
    const { merchant } = request;

    if (!merchant?.id) {
      throw new UnauthorizedException(translations.notFound);
    }

    let appConfig = await this.service.findOne({
      where: { merchantId: merchant.id },
    });

    if (!appConfig) {
      appConfig = this.service.create({
        merchantId: merchant.id,
      });
    }

    appConfig.iconFileUrl = (await this.filesService.upload(file)).Location;
    return this.service.save(appConfig);
  }
}
