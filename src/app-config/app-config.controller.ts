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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AppConfigService } from 'src/app-config/app-config.service';
import { MerchantsGuard } from 'src/guards/merchants.guard';
import {
  UserTypeGuard,
  UserTypeGuardedRequest,
} from 'src/guards/user-type.guard';
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
import { NestError } from 'src/utils/error';
import { ConfigUpdateDto } from './dto/app-config-update.input';
import { AppConfig } from './entities/app-config.entity';

@ApiTags('Config')
@Controller({
  path: 'app-config',
  version: '2',
})
export class AppConfigController {
  constructor(private readonly service: AppConfigService) {}

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
  @ApiBody({ type: ConfigUpdateDto })
  async create(
    @Req() request: any,
    @Body()
    createAppConfigDto: ConfigUpdateDto,
  ) {
    if (
      await this.service.exist({ where: { merchantId: request.merchant.id } })
    ) {
      throw new BadRequestException(
        `AppConfig with merchant id ${request.merchant.id} already exists`,
      );
    }

    return this.service.save(
      this.service.create({
        merchantId: request.merchant.id,
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
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AppConfig })
  @ApiOperation({ summary: 'Update your Config', operationId: 'updateConfig' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: NestError })
  @ApiBody({ type: ConfigUpdateDto })
  async update(
    @Req() request: any,
    @Body() updateAppConfigDto: ConfigUpdateDto,
  ) {
    const merchantId = request.merchant.id;
    const entity = await this.service.findOne({ where: { merchantId } });
    if (!entity?.id) {
      throw new UnauthorizedException(
        `AppConfig with merchant id ${merchantId} not found`,
      );
    }

    Object.assign(entity, updateAppConfigDto);

    return this.service.save(entity);
  }
}
