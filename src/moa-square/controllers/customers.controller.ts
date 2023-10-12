import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  ParseBoolPipe,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { NestSquareService } from 'nest-square';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Between, Not } from 'typeorm';
import { ApiKeyAuthGuard } from '../../authentication/apikey-auth.guard.js';
import type { UsersGuardedRequest } from '../../authentication/users.guard.js';
import { UsersGuard } from '../../authentication/users.guard.js';
import { buildPaginatedResults } from '../../database/build-paginated-results.js';
import { SortOrderEnum } from '../../database/sort-order.enum.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { MailService } from '../../mail/mail.service.js';
import { UsersService } from '../../users/users.service.js';
import { ErrorResponse } from '../../utils/error-response.js';
import { ParseISODatePipe } from '../../utils/parse-iso-date.pipe-transform.js';
import { AppInstallPostBody } from '../dto/customers/app-install-update.dto.js';
import { CustomerPatchBody } from '../dto/customers/customer-patch-body.dto.js';
import { CustomersFieldEnum } from '../dto/customers/customers-field.js';
import { CustomersPaginatedResponse } from '../dto/customers/customers-paginated-response.dto.js';
import { SquareCard } from '../dto/square/square.dto.js';
import { CustomerEntity } from '../entities/customer.entity.js';
import type { CustomersGuardedRequest } from '../guards/customers.guard.js';
import { CustomersGuard } from '../guards/customers.guard.js';
import { MerchantsGuard } from '../guards/merchants.guard.js';
import { AppInstallsService } from '../services/app-installs.service.js';
import { CustomersService } from '../services/customers.service.js';
import { MerchantsService } from '../services/merchants.service.js';

@ApiUnauthorizedResponse({
  description: 'You need to be authenticated to access this endpoint.',
  type: ErrorResponse,
})
@ApiTags('Customers')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'customers',
  version: '2',
})
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(
    private readonly service: CustomersService,
    private readonly appInstallsService: AppInstallsService,
    private readonly squareService: NestSquareService,
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly mailService: MailService,
    private readonly merchantsService: MerchantsService,
    private readonly usersService: UsersService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  translations() {
    return this.i18n.t('moaSquare', {
      lang: I18nContext.current()?.lang,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @Post('me')
  @ApiBadRequestResponse({
    description: 'Merchant does not have Square access token',
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: 'Customer already exists',
    type: ErrorResponse,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: CustomerEntity })
  @ApiOperation({
    summary: 'Create Customer for current User',
    operationId: 'postCustomerMe',
  })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiQuery({ name: 'user', required: false, type: Boolean })
  @ApiQuery({ name: 'merchant', required: false, type: Boolean })
  @ApiQuery({ name: 'currentOrder', required: false, type: Boolean })
  @ApiQuery({ name: 'preferredLocation', required: false, type: Boolean })
  async post(
    @Req() request: UsersGuardedRequest,
    @Query('merchantIdOrPath') merchantIdOrPath: string,
    @Query('user', new DefaultValuePipe(false), ParseBoolPipe)
    userRelation?: boolean,
    @Query('merchant', new DefaultValuePipe(false), ParseBoolPipe)
    merchantRelation?: boolean,
    @Query('currentOrder', new DefaultValuePipe(false), ParseBoolPipe)
    currentOrderRelation?: boolean,
    @Query('preferredLocation', new DefaultValuePipe(false), ParseBoolPipe)
    preferredLocationRelation?: boolean,
  ) {
    this.logger.verbose(this.post.name);
    const translations = this.translations();

    const { user } = request;
    const { id: userId } = user;

    if (!userId) {
      throw new BadRequestException(translations.idNotFound);
    }

    const merchant = await this.merchantsService.findOneByIdOrPath({
      where: { idOrPath: merchantIdOrPath },
    });

    if (!merchant) {
      throw new NotFoundException(translations.merchantsNotFound);
    }

    const created = await this.service.createSaveAndSyncSquare({
      userId,
      merchantIdOrPath: merchantIdOrPath,
    });

    try {
      await this.mailService.sendPostCustomerMeOrThrow({
        user,
        merchant,
      });
    } catch (error) {
      this.logger.error(error);
    }

    const found = await this.service.findOne({
      where: { id: created.id },
      relations: {
        user: userRelation,
        merchant: merchantRelation,
        currentOrder: currentOrderRelation,
        preferredLocation: preferredLocationRelation
          ? {
              businessHours: preferredLocationRelation,
              address: preferredLocationRelation,
            }
          : undefined,
      },
    });

    if (found == undefined) {
      throw new NotFoundException(translations.idNotFound);
    }

    return found;
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CustomerEntity })
  @ApiOperation({
    summary: 'Get current Customer',
    operationId: 'getCustomerMe',
  })
  @ApiQuery({ name: 'user', required: false, type: Boolean })
  @ApiQuery({ name: 'merchant', required: false, type: Boolean })
  @ApiQuery({ name: 'currentOrder', required: false, type: Boolean })
  @ApiQuery({ name: 'preferredLocation', required: false, type: Boolean })
  @ApiQuery({ name: 'preferredSquareCard', required: false, type: Boolean })
  async getMe(
    @Req() request: CustomersGuardedRequest,
    @Query('user', new DefaultValuePipe(false), ParseBoolPipe)
    userRelation?: boolean,
    @Query('merchant', new DefaultValuePipe(false), ParseBoolPipe)
    merchantRelation?: boolean,
    @Query('currentOrder', new DefaultValuePipe(false), ParseBoolPipe)
    currentOrderRelation?: boolean,
    @Query('preferredLocation', new DefaultValuePipe(false), ParseBoolPipe)
    preferredLocationRelation?: boolean,
    @Query('preferredSquareCard', new DefaultValuePipe(false), ParseBoolPipe)
    preferredSquareCardRelation?: boolean,
  ): Promise<CustomerEntity> {
    const { customer, merchant } = request;

    this.logger.verbose(this.getMe.name);
    const translations = this.translations();

    if (!customer.id || !merchant.id) {
      throw new BadRequestException(translations.idNotFound);
    }

    const found = await this.service.findOneOrFail({
      where: { id: customer.id, merchantId: merchant.id },
      relations: {
        user: userRelation,
        merchant: merchantRelation,
        currentOrder: currentOrderRelation,
        preferredLocation: preferredLocationRelation
          ? {
              businessHours: preferredLocationRelation,
              address: preferredLocationRelation,
            }
          : undefined,
      },
    });

    if (preferredSquareCardRelation) {
      if (!merchant.squareAccessToken || !found.squareId) {
        throw new BadRequestException(
          translations.merchantsSquareAccessTokenNotFound,
        );
      }

      const { preferredSquareCardId } = found;
      if (
        preferredSquareCardId !== null &&
        preferredSquareCardId !== undefined
      ) {
        const squareResponse = await this.squareService.retryOrThrow(
          merchant.squareAccessToken,
          (client) => client.cardsApi.retrieveCard(preferredSquareCardId),
        );
        found.preferredSquareCard = squareResponse.result.card as SquareCard;
      }
    }

    return found;
  }

  @ApiBearerAuth()
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CustomerEntity })
  @ApiOperation({
    summary: 'Delete current Customer',
    operationId: 'deleteCustomerMe',
  })
  async deleteMe(@Req() request: CustomersGuardedRequest): Promise<void> {
    const { customer, merchant, user } = request;

    this.logger.verbose(this.deleteMe.name);
    const translations = this.translations();

    if (!customer.id || !merchant.id) {
      throw new BadRequestException(translations.idNotFound);
    }

    await this.service.remove(customer);

    const customerSquareId = customer.squareId;
    if (
      merchant.squareAccessToken &&
      customerSquareId !== undefined &&
      customerSquareId !== null
    ) {
      try {
        await this.squareService.retryOrThrow(
          merchant.squareAccessToken,
          (client) => {
            return client.customersApi.deleteCustomer(customerSquareId);
          },
        );
      } catch (error) {
        this.logger.error(error);
      }
    }

    try {
      await this.mailService.sendDeleteCustomerMeOrThrow({ user, merchant });
    } catch (error) {
      this.logger.error(error);
    }

    await this.usersService.removeIfUnrelated(user);

    return;
  }

  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ type: CustomerEntity })
  @ApiOperation({
    summary: 'Update your Customer',
    operationId: 'patchCustomerMe',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ErrorResponse })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiBody({ type: CustomerPatchBody })
  @ApiQuery({ name: 'user', required: false, type: Boolean })
  @ApiQuery({ name: 'merchant', required: false, type: Boolean })
  @ApiQuery({ name: 'currentOrder', required: false, type: Boolean })
  @ApiQuery({ name: 'preferredLocation', required: false, type: Boolean })
  @ApiQuery({ name: 'preferredSquareCard', required: false, type: Boolean })
  async patchMe(
    @Req() request: CustomersGuardedRequest,
    @Body() body: CustomerPatchBody,
    @Query('user', new DefaultValuePipe(false), ParseBoolPipe)
    userRelation?: boolean,
    @Query('merchant', new DefaultValuePipe(false), ParseBoolPipe)
    merchantRelation?: boolean,
    @Query('currentOrder', new DefaultValuePipe(false), ParseBoolPipe)
    currentOrderRelation?: boolean,
    @Query('preferredLocation', new DefaultValuePipe(false), ParseBoolPipe)
    preferredLocationRelation?: boolean,
    @Query('preferredSquareCard', new DefaultValuePipe(false), ParseBoolPipe)
    preferredSquareCardRelation?: boolean,
  ) {
    const { customer, merchant } = request;

    this.logger.verbose(this.patchMe.name);
    const translations = this.translations();

    if (!customer.id || !merchant.id) {
      throw new UnprocessableEntityException(translations.idNotFound);
    }

    await this.service.patchAndSyncSquare({
      id: customer.id,
      merchantId: merchant.id,
      body: body,
    });

    const found = await this.service.findOneOrFail({
      where: { id: customer.id, merchantId: merchant.id },
      relations: {
        user: userRelation,
        merchant: merchantRelation,
        currentOrder: currentOrderRelation,
        preferredLocation: preferredLocationRelation
          ? {
              businessHours: preferredLocationRelation,
              address: preferredLocationRelation,
            }
          : undefined,
      },
    });

    if (preferredSquareCardRelation) {
      if (!merchant.squareAccessToken || !customer.squareId) {
        throw new BadRequestException(
          translations.merchantsSquareAccessTokenNotFound,
        );
      }

      const { preferredSquareCardId } = found;
      if (
        preferredSquareCardId !== null &&
        preferredSquareCardId !== undefined
      ) {
        const squareResponse = await this.squareService.retryOrThrow(
          merchant.squareAccessToken,
          (client) => client.cardsApi.retrieveCard(preferredSquareCardId),
        );
        found.preferredSquareCard = squareResponse.result.card as SquareCard;
      }
    }

    return found;
  }

  @ApiBearerAuth()
  @Get()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: CustomersPaginatedResponse })
  @ApiOperation({
    summary: 'Get my Customers',
    operationId: 'getCustomers',
  })
  @ApiQuery({ name: 'user', required: false, type: Boolean })
  @ApiQuery({ name: 'merchant', required: false, type: Boolean })
  @ApiQuery({ name: 'currentOrder', required: false, type: Boolean })
  @ApiQuery({ name: 'preferredLocation', required: false, type: Boolean })
  @ApiQuery({ name: 'orderField', required: false, enum: CustomersFieldEnum })
  @ApiQuery({ name: 'orderSort', required: false, enum: SortOrderEnum })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getMany(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('user', new DefaultValuePipe(false), ParseBoolPipe)
    userRelation?: boolean,
    @Query('merchant', new DefaultValuePipe(false), ParseBoolPipe)
    merchantRelation?: boolean,
    @Query('currentOrder', new DefaultValuePipe(false), ParseBoolPipe)
    currentOrderRelation?: boolean,
    @Query('preferredLocation', new DefaultValuePipe(false), ParseBoolPipe)
    preferredLocationRelation?: boolean,
    @Query(
      'orderField',
      new DefaultValuePipe('createDate'),
      new ParseEnumPipe(CustomersFieldEnum),
    )
    orderField?: CustomersFieldEnum,
    @Query(
      'orderSort',
      new DefaultValuePipe('DESC'),
      new ParseEnumPipe(SortOrderEnum),
    )
    orderSort?: SortOrderEnum,
    @Query('startDate', ParseISODatePipe)
    startDate?: Date,
    @Query('endDate', ParseISODatePipe)
    endDate?: Date,
  ): Promise<CustomersPaginatedResponse> {
    this.logger.verbose(this.getMany.name);
    return buildPaginatedResults({
      results: await this.service.findAndCount({
        where: {
          merchantId: request.merchant.id,
          user: {
            id: Not(request.user.id),
          },
          createDate:
            startDate && endDate ? Between(startDate!, endDate!) : undefined,
        },
        order: { [orderField as keyof CustomerEntity]: orderSort },
        take: limit,
        skip: (page - 1) * limit,
        relations: {
          user: userRelation,
          merchant: merchantRelation,
          currentOrder: currentOrderRelation,
          preferredLocation: preferredLocationRelation
            ? {
                businessHours: preferredLocationRelation,
                address: preferredLocationRelation,
              }
            : undefined,
        },
      }),
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Post('me/app-install')
  @ApiOperation({
    summary: 'Create or update Customer App Install',
    operationId: 'updateAppInstallMe',
  })
  @ApiBody({ type: AppInstallPostBody })
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
  })
  @ApiOkResponse({
    description: 'The record has been successfully updated.',
  })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  async updateMyAppInstall(
    @Req() request: CustomersGuardedRequest,
    @Body() body: AppInstallPostBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.verbose(this.updateMyAppInstall.name);

    const { customer } = request;

    // Find the AppInstall entity with the provided tokenId
    let appInstall = await this.appInstallsService.findOne({
      where: {
        firebaseInstallationId: body.firebaseInstallationId,
        customerId: customer.id,
      },
    });

    res.status(HttpStatus.OK);

    if (!appInstall) {
      // Create a new AppInstall entity
      appInstall = this.appInstallsService.create({
        customerId: customer.id,
        firebaseInstallationId: body.firebaseInstallationId,
      });
      res.status(HttpStatus.CREATED);
    }

    // Update the AppInstall entity with the new FCM token
    appInstall = await this.appInstallsService.save(
      this.appInstallsService.merge(appInstall, {
        firebaseCloudMessagingToken: body.firebaseCloudMessagingToken,
      }),
    );

    return;
  }
}
