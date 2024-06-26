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
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseBoolPipe,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Between, IsNull, Not } from 'typeorm';
import { ApiKeyAuthGuard } from '../../authentication/apikey-auth.guard.js';
import { buildPaginatedResults } from '../../database/build-paginated-results.js';
import { SortOrderEnum } from '../../database/sort-order.enum.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { MailService } from '../../mail/mail.service.js';
import { MessagesService } from '../../messages/messages.service.js';
import { PushService } from '../../push/push.service.js';
import { UserTypeEnum } from '../../users/dto/type-user.dto.js';
import { ErrorResponse } from '../../utils/error-response.js';
import { ParseISODatePipe } from '../../utils/parse-iso-date.pipe-transform.js';
import { OrderPatchBody } from '../dto/orders/order-patch.dto.js';
import { OrderPostBody } from '../dto/orders/order-post.dto.js';
import { OrdersOrderFieldEnum } from '../dto/orders/orders-order-field.enum.js';
import { OrdersPaginatedResponse } from '../dto/orders/orders-paginated-response.dto.js';
import { OrderPostCurrentBody } from '../dto/orders/orders-post-current-body.dto.js';
import { OrdersStatisticsResponse } from '../dto/orders/orders-statistics-reponse.dto.js';
import { OrdersPostPaymentBody } from '../dto/orders/payment-create.dto.js';
import { OrderEntity } from '../entities/order.entity.js';
import type { UserTypeGuardedRequest } from '../guards/customer-merchant.guard.js';
import { CustomerMerchantGuard } from '../guards/customer-merchant.guard.js';
import type { CustomersGuardedRequest } from '../guards/customers.guard.js';
import { CustomersGuard } from '../guards/customers.guard.js';
import { MerchantsGuard } from '../guards/merchants.guard.js';
import { OrdersService } from '../services/orders.service.js';

@UseGuards(ApiKeyAuthGuard)
@ApiTags('Orders')
@ApiSecurity('Api-Key')
@Controller('v2/orders')
@ApiUnauthorizedResponse({
  description: 'You need to be authenticated to access this endpoint.',
  type: ErrorResponse,
})
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly service: OrdersService,
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly messagesService: MessagesService,
    private readonly mailService: MailService,
    private readonly pushService: PushService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  translations() {
    return this.i18n.t('moaSquare', {
      lang: I18nContext.current()?.lang,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Post()
  @ApiBadRequestResponse({
    description: 'Current order already exists',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Invalid location ID',
    type: ErrorResponse,
  })
  @ApiOperation({
    summary: 'Create Order',
    operationId: 'postOrder',
  })
  @ApiUnprocessableEntityResponse({
    description: 'No Square tokens',
    type: ErrorResponse,
  })
  @ApiCreatedResponse({ type: OrderEntity })
  @ApiBody({ required: true, type: OrderPostBody })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async post(
    @Req() request: CustomersGuardedRequest,
    @Body() body: OrderPostBody,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
  ) {
    const { customer, merchant } = { ...request };
    const { idempotencyKey, locationId, variations } = body;

    this.logger.verbose(this.post.name);
    const translations = this.translations();

    if (customer.currentOrderId) {
      throw new BadRequestException(translations.ordersExists);
    }
    if (!merchant.squareAccessToken) {
      throw new UnprocessableEntityException(
        translations.merchantsSquareAccessTokenNotFound,
      );
    }
    if (!customer.squareId) {
      throw new UnprocessableEntityException(
        translations.customersSquareIdNotFound,
      );
    }

    const savedOrder = await this.service.createOne({
      variations,
      idempotencyKey,
      customer,
      locationId,
      merchant,
    });

    return await this.service.findOne({
      where: {
        id: savedOrder.id,
        customerId: request.customer?.id,
        merchantId: request.merchant?.id,
      },
      relations: {
        lineItems: lineItems
          ? {
              modifiers: lineItems,
            }
          : undefined,
        location: location
          ? {
              address: true,
              businessHours: true,
            }
          : undefined,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Get('current')
  @ApiOkResponse({ type: OrderEntity })
  @ApiOperation({
    summary: 'Get current Order',
    operationId: 'getOrderCurrent',
  })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async getCurrent(
    @Req() request: CustomersGuardedRequest,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
  ): Promise<OrderEntity> {
    const { customer, merchant } = { ...request };

    this.logger.verbose(this.getCurrent.name);
    const translations = this.translations();

    if (!customer.currentOrderId) {
      throw new NotFoundException(translations.ordersNotFound);
    }
    const entity = await this.service.findOne({
      where: {
        id: customer.currentOrderId,
        customerId: customer?.id,
        merchantId: merchant?.id,
      },
      relations: {
        lineItems: lineItems
          ? {
              modifiers: lineItems,
            }
          : undefined,
        location: location
          ? {
              address: true,
              businessHours: true,
            }
          : undefined,
      },
    });
    if (!entity) {
      customer.currentOrderId = undefined;
      await customer.save();

      throw new NotFoundException(translations.ordersNotFound);
    }

    if (!entity.squareId) {
      throw new UnprocessableEntityException(
        translations.ordersSquareIdNotFound,
      );
    }

    if (!merchant.squareAccessToken) {
      throw new UnprocessableEntityException(
        translations.merchantsSquareAccessTokenNotFound,
      );
    }

    return entity;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomerMerchantGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get my Orders',
    operationId: 'getOrders',
  })
  @ApiOkResponse({ type: OrdersPaginatedResponse })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'merchantIdOrPath', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @ApiQuery({ name: 'closed', required: false, type: Boolean })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  @ApiQuery({ name: 'customer', required: false, type: Boolean })
  @ApiQuery({ name: 'orderField', required: false, enum: OrdersOrderFieldEnum })
  @ApiQuery({ name: 'orderSort', required: false, enum: SortOrderEnum })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getMe(
    @Req() request: UserTypeGuardedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('closed') closed?: boolean,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
    @Query('customer', new DefaultValuePipe(false), ParseBoolPipe)
    customer?: boolean,
    @Query(
      'orderField',
      new DefaultValuePipe('pickupDate'),
      new ParseEnumPipe(OrdersOrderFieldEnum),
    )
    orderField?: OrdersOrderFieldEnum,
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
  ) {
    this.logger.verbose(
      `${this.getMe.name} merchantId:${request.merchant?.id} customerId: ${request.customer?.id}`,
    );

    return buildPaginatedResults({
      results: await this.service.findAndCount({
        where: {
          customerId: request.customer?.id,
          merchantId: request.merchant?.id,
          closedDate:
            startDate && endDate
              ? Between(startDate!, endDate!)
              : closed
                ? Not(IsNull())
                : undefined,
        },
        order: { [orderField as keyof OrderEntity]: orderSort },
        take: limit,
        skip: (page - 1) * limit,
        relations: {
          lineItems: lineItems
            ? {
                modifiers: lineItems,
              }
            : undefined,
          location: location
            ? {
                address: true,
                businessHours: true,
              }
            : undefined,
          customer: customer
            ? {
                user: customer,
              }
            : undefined,
        },
      }),
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomerMerchantGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get Order',
    operationId: 'getOrder',
  })
  @ApiOkResponse({ type: OrderEntity })
  @ApiQuery({ name: 'merchantIdOrPath', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async getId(
    @Req() request: UserTypeGuardedRequest,
    @Param('id') id: string,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
  ) {
    this.logger.verbose(`${this.getId.name} id:${id}`);
    const { merchant, customer } = { ...request };
    const translations = this.translations();
    try {
      return await this.service.findOneOrFail({
        where: {
          id: id,
          customerId: customer?.id,
          merchantId: merchant?.id,
        },
        relations: {
          lineItems: lineItems
            ? {
                modifiers: lineItems,
              }
            : undefined,
          location: location
            ? {
                address: true,
                businessHours: true,
              }
            : undefined,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw new NotFoundException(translations.ordersNotFound);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Get('statistics/me')
  @ApiOperation({
    summary: 'Get your statistics',
    operationId: 'getOrderStatisticsMe',
  })
  @ApiOkResponse({ type: OrdersStatisticsResponse })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getStatisticsMe(
    @Req() request: UserTypeGuardedRequest,
    @Query('startDate', ParseISODatePipe)
    startDate?: Date,
    @Query('endDate', ParseISODatePipe)
    endDate?: Date,
  ): Promise<OrdersStatisticsResponse> {
    this.logger.verbose(this.getStatisticsMe.name);
    const translations = this.translations();
    const {
      merchant: { id },
    } = { ...request };
    if (!id) {
      throw new NotFoundException(translations.merchantsNotFound);
    }

    return await this.service.statistics({
      merchantId: id,
      closedDate:
        startDate && startDate ? Between(startDate!, endDate!) : undefined,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Patch('current')
  @ApiOperation({
    summary: 'Patch update Order, e.g. modify Location',
    operationId: 'patchOrderCurrent',
  })
  @ApiOkResponse({ type: OrderEntity })
  @ApiBadRequestResponse({
    description: 'Order not found',
    type: ErrorResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid location ID',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Square error',
    type: ErrorResponse,
  })
  @ApiQuery({ name: 'merchantIdOrPath', required: false, type: String })
  @ApiQuery({ name: 'idempotencyKey', required: false, type: String })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async patchCurrent(
    @Req() request: CustomersGuardedRequest,
    @Body() body: OrderPatchBody,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,

    @Query('idempotencyKey') idempotencyKey?: string,
  ) {
    const { merchant, customer } = { ...request };

    this.logger.verbose(this.patchCurrent.name);
    const translations = this.translations();

    const currentOrderId = customer.currentOrderId;

    if (!currentOrderId) {
      throw new UnprocessableEntityException(
        translations.ordersSquareIdNotFound,
      );
    }

    if (!(await this.service.exist({ where: { id: currentOrderId } }))) {
      throw new NotFoundException(translations.ordersNotFound);
    }

    if (body.locationId) {
      await this.service.updateOne({
        locationMoaId: body.locationId,
        merchant,
        orderId: currentOrderId,
        idempotencyKey,
      });
    }

    return await this.service.findOne({
      where: { id: currentOrderId },
      relations: {
        lineItems: lineItems
          ? {
              modifiers: lineItems,
            }
          : undefined,
        location: location
          ? {
              address: true,
              businessHours: true,
            }
          : undefined,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Post('current')
  @ApiCreatedResponse({ type: OrderEntity })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiOperation({
    summary: 'Post update Order, e.g. add Variations & Modifiers in Line Items',
    operationId: 'postOrderCurrent',
  })
  @ApiBadRequestResponse({
    description: 'No current Order or Invalid variation',
    type: ErrorResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'No Square Order ID or Square Access Token',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Square error',
    type: ErrorResponse,
  })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiQuery({ name: 'idempotencyKey', required: false, type: String })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async postCurrent(
    @Req() request: CustomersGuardedRequest,
    @Body() body: OrderPostCurrentBody,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
    @Query('idempotencyKey') idempotencyKey?: string,
  ) {
    const { variations } = body;
    const { customer, merchant } = request;
    const { currentOrderId } = customer;

    this.logger.verbose(this.postCurrent.name);
    const translations = this.translations();

    if (!merchant.squareAccessToken) {
      throw new UnprocessableEntityException(
        translations.merchantsSquareIdNotFound,
      );
    }
    if (!customer.squareId) {
      throw new UnprocessableEntityException(
        translations.customersSquareIdNotFound,
      );
    }

    let returnOrderId: string | undefined = undefined;
    if (variations && variations.length > 0) {
      if (currentOrderId != null) {
        if (await this.service.exist({ where: { id: currentOrderId } })) {
          await this.service.updateMany({
            variations,
            orderId: currentOrderId,
            squareAccessToken: merchant.squareAccessToken,
            idempotencyKey,
          });
          returnOrderId = currentOrderId;
        } else {
          customer.currentOrderId = undefined;
          await customer.save();
          throw new NotFoundException(translations.ordersNotFound);
        }
      } else {
        returnOrderId = (
          await this.service.createOne({
            variations,
            idempotencyKey,
            customer,
            merchant,
          })
        ).id;
      }
    }

    if (!returnOrderId) {
      throw new NotFoundException(translations.ordersNotFound);
    }

    return await this.service.findOne({
      where: { id: returnOrderId },
      relations: {
        lineItems: lineItems
          ? {
              modifiers: lineItems,
            }
          : undefined,
        location: location
          ? {
              address: true,
              businessHours: true,
            }
          : undefined,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Delete('current/line-item/:id')
  @ApiOkResponse({ type: OrderEntity })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiOperation({
    summary: 'Remove Line Items from Order',
    operationId: 'deleteLineItemCurrent',
  })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async deleteCurrentLineItem(
    @Req() request: CustomersGuardedRequest,
    @Param('id') id: string,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
  ) {
    const { customer, merchant } = { ...request };
    const squareAccessToken = merchant.squareAccessToken;
    const currentOrderId = customer.currentOrderId;

    this.logger.verbose(this.deleteCurrentLineItem.name);
    const translations = this.translations();

    if (!currentOrderId) {
      throw new NotFoundException(translations.ordersNotFound);
    }

    if (!squareAccessToken) {
      throw new UnprocessableEntityException(
        translations.merchantsSquareAccessTokenNotFound,
      );
    }

    if (!(await this.service.exist({ where: { id: currentOrderId } }))) {
      throw new NotFoundException(translations.ordersNotFound);
    }

    await this.service.removeLineItems({
      squareAccessToken,
      lineItemIds: [id],
      orderId: currentOrderId,
    });

    return await this.service.findOne({
      where: { id: currentOrderId },
      relations: {
        lineItems: lineItems
          ? {
              modifiers: lineItems,
            }
          : undefined,
        location: location
          ? {
              address: true,
              businessHours: true,
            }
          : undefined,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Delete('current')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiNoContentResponse({ description: 'Order Deleted Successfully' })
  @ApiOperation({
    summary: 'Delete Order',
    operationId: 'deleteOrderCurrent',
  })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  async deleteCurrent(@Req() request: CustomersGuardedRequest): Promise<void> {
    const { customer } = request;

    this.logger.verbose(this.deleteCurrent.name);
    const translations = this.translations();

    if (!customer.currentOrderId) {
      throw new NotFoundException(translations.ordersNotFound);
    }

    const entity = await this.service.findOne({
      where: { id: customer.currentOrderId },
    });

    if (!entity) {
      customer.currentOrderId = undefined;
      await customer.save();
      throw new NotFoundException(translations.ordersNotFound);
    }

    await this.service.remove(entity);

    return;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Post('current/payment/square')
  @ApiOperation({
    summary: 'Pay for Order',
    operationId: 'postSquarePaymentOrderCurrent',
  })
  @ApiCreatedResponse({ description: 'Payment Successful', type: OrderEntity })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiNotFoundResponse({ description: 'No current order', type: ErrorResponse })
  @ApiUnprocessableEntityResponse({
    description: 'No Square Access Token',
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid pickup time',
    type: ErrorResponse,
  })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async postCurrentPaymentSquare(
    @Req() request: CustomersGuardedRequest,
    @Body() body: OrdersPostPaymentBody,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
  ) {
    const { customer, merchant, user } = { ...request };
    const { currentOrderId } = customer;

    this.logger.verbose(this.postCurrentPaymentSquare.name);
    const translations = this.translations();

    if (!currentOrderId) {
      customer.currentOrderId = undefined;
      await customer.save();
      throw new NotFoundException(translations.ordersNotFound);
    }

    if (!(await this.service.exist({ where: { id: currentOrderId } }))) {
      throw new NotFoundException(translations.ordersNotFound);
    }

    if (!merchant.squareAccessToken) {
      throw new UnprocessableEntityException(
        translations.merchantsSquareAccessTokenNotFound,
      );
    }

    if (!customer.id || !merchant.id || !user.id) {
      throw new UnprocessableEntityException(translations.idNotFound);
    }

    await this.service.createPaymentOrThrow({
      orderId: currentOrderId,
      customerId: customer.id,
      input: body,
      merchantId: merchant.id,
    });

    const order = await this.service.findOne({
      where: { id: currentOrderId },
      relations: {
        lineItems: lineItems
          ? {
              modifiers: lineItems,
            }
          : undefined,
        location: location
          ? {
              address: true,
              businessHours: true,
            }
          : undefined,
        customer: {
          user: true,
          appInstalls: true,
        },
        merchant: true,
      },
    });

    if (!order) {
      throw new NotFoundException(translations.ordersNotFound);
    }

    try {
      await this.messagesService.sendPostSquarePaymentOrderCurrentOrThrow({
        order,
      });
    } catch (error) {
      this.logger.log(error);
    }

    try {
      await this.mailService.sendPostSquarePaymentOrderCurrentOrThrow({
        order,
      });
    } catch (error) {
      this.logger.error(error);
    }

    try {
      await this.pushService.sendPostSquarePaymentOrderCurrentOrThrow({
        order,
      });
    } catch (error) {
      this.logger.error(error);
    }

    return order;
  }
}
