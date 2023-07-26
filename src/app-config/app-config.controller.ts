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
import { AppConfigService } from 'src/app-config/app-config.service';
import { FilesService } from 'src/files/files.service';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import {
  MerchantsGuard,
  MerchantsGuardedRequest,
} from 'src/guards/merchants.guard';
import {
  UserTypeGuard,
  UserTypeGuardedRequest,
} from 'src/guards/user-type.guard';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { NestError } from 'src/utils/error';
import { AppConfigUpdateDto } from './dto/app-config-update.input';
import { AppConfig } from './entities/app-config.entity';

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
  ) {}

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
  @ApiOperation({ summary: 'Get your Config', operationId: 'getConfig' })
  async get(@Req() request: UserTypeGuardedRequest) {
    const appConfig = await this.service.findOne({
      where: { merchantId: request.merchant.id },
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
  async create(
    @Req() request: MerchantsGuardedRequest,
    @Body()
    createAppConfigDto: AppConfigUpdateDto,
  ) {
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @Patch('me')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ type: AppConfig })
  @ApiOperation({ summary: 'Update your Config', operationId: 'updateConfig' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: NestError })
  @ApiBody({ type: AppConfigUpdateDto })
  async update(
    @Req() request: MerchantsGuardedRequest,
    @Body() updateAppConfigDto: AppConfigUpdateDto,
  ) {
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
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload icon', operationId: 'uploadIcon' })
  async uploadFile(
    @Req() request: MerchantsGuardedRequest,
    @UploadedFile() file: Express.Multer.File | Express.MulterS3.File,
  ) {
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

    appConfig.iconFile = await this.filesService.uploadFile(file);
    return this.service.save(appConfig);
  }
}
