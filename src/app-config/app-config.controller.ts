import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
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
import { AppConfigService } from '../app-config/app-config.service.js';
import { FilesService } from '../files/files.service.js';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import type { MerchantsGuardedRequest } from '../guards/merchants.guard.js';
import { MerchantsGuard } from '../guards/merchants.guard.js';
import type { UserTypeGuardedRequest } from '../guards/user-type.guard.js';
import { UserTypeGuard } from '../guards/user-type.guard.js';
import { AppLogger } from '../logger/app.logger.js';
import { UserTypeEnum } from '../users/dto/type-user.dto.js';
import { NestError } from '../utils/error.js';
import { AppConfigUpdateDto } from './dto/app-config-update.input.js';
import { AppConfig } from './entities/app-config.entity.js';

@ApiTags('Configs')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'app-config',
  version: '2',
})
export class AppConfigController {
  constructor(
    private readonly service: AppConfigService,
    private readonly filesService: FilesService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AppConfigController.name);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AppConfig })
  @ApiNotFoundResponse({ description: 'App config not found', type: NestError })
  @ApiOperation({
    summary: 'Get your Config',
    operationId: 'getMyConfig',
  })
  async getMyConfig(
    @Req() request: UserTypeGuardedRequest,
    @Query('merchantId') merchantId?: string,
  ) {
    this.logger.verbose(this.getMyConfig.name);
    const appConfig = await this.service.findOne({
      where: { merchantId: merchantId ?? request.merchant.id },
    });

    if (!appConfig) {
      throw new NotFoundException(`App config not found`);
    }

    return appConfig;
  }

  @ApiBearerAuth()
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AppConfig })
  @ApiNotFoundResponse({ description: 'App config not found', type: NestError })
  @ApiOperation({
    summary: 'Get Config for Merchant ID',
    operationId: 'getConfigForMerchant',
  })
  async get(@Query('merchantId') merchantId: string) {
    this.logger.verbose(this.get.name);
    const appConfig = await this.service.findOne({
      where: { merchantId: merchantId },
    });

    if (!appConfig) {
      throw new NotFoundException(`App config not found`);
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
    type: NestError,
  })
  @ApiBadRequestResponse({
    description: 'AppConfig already exists',
    type: NestError,
  })
  @ApiOperation({ summary: 'Create your Config', operationId: 'createConfig' })
  @ApiBody({ type: AppConfigUpdateDto })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Req() request: MerchantsGuardedRequest,
    @Body()
    createAppConfigDto: AppConfigUpdateDto,
  ) {
    this.logger.verbose(this.create.name);
    const { merchant } = request;

    if (!merchant?.id) {
      throw new UnauthorizedException(`AppConfig not found`);
    }

    if (await this.service.exist({ where: { merchantId: merchant.id } })) {
      throw new BadRequestException(
        `AppConfig with merchant id ${merchant.id} already exists`,
      );
    }

    return this.service.save(
      this.service.create({
        merchantId: merchant.id,
        ...createAppConfigDto,
      }),
    );
  }

  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AppConfig })
  @ApiOperation({ summary: 'Update your Config', operationId: 'updateConfig' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: NestError })
  @ApiBody({ type: AppConfigUpdateDto })
  async update(
    @Req() request: MerchantsGuardedRequest,
    @Body() updateAppConfigDto: AppConfigUpdateDto,
  ) {
    this.logger.verbose(this.update.name);
    const { merchant } = request;

    if (!merchant?.id) {
      throw new UnauthorizedException(`AppConfig not found`);
    }

    let appConfig = await this.service.findOne({
      where: { merchantId: merchant.id },
    });

    if (!appConfig) {
      appConfig = this.service.create({
        merchantId: merchant.id,
      });
    }

    Object.assign(appConfig, updateAppConfigDto);

    return this.service.save(appConfig);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
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
  @ApiOperation({ summary: 'Upload icon', operationId: 'uploadIcon' })
  async uploadFile(
    @Req() request: MerchantsGuardedRequest,
    @UploadedFile() file: Express.Multer.File | Express.MulterS3.File,
  ) {
    this.logger.verbose(this.uploadFile.name);
    const { merchant } = request;

    if (!merchant?.id) {
      throw new UnauthorizedException(`Merchant not found`);
    }

    let appConfig = await this.service.findOne({
      where: { merchantId: merchant.id },
    });

    if (!appConfig) {
      appConfig = this.service.create({
        merchantId: merchant.id,
      });
    }

    appConfig.iconFile = await this.filesService.upload(file);
    return this.service.save(appConfig);
  }
}
