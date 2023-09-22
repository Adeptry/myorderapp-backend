import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseBoolPipe,
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
import { IsNull, Not } from 'typeorm';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import type { CustomersGuardedRequest } from '../guards/customers.guard.js';
import { CustomersGuard } from '../guards/customers.guard.js';
import type { UserTypeGuardedRequest } from '../guards/user-type.guard.js';
import { UserTypeGuard } from '../guards/user-type.guard.js';
import { AppLogger } from '../logger/app.logger.js';
import { OrdersService } from '../orders/orders.service.js';
import { UserTypeEnum } from '../users/dto/type-user.dto.js';
import { ErrorResponse } from '../utils/error-response.js';
import { paginatedResults } from '../utils/paginated.js';
import { OrderPatchDto } from './dto/order-patch.dto.js';
import { OrderCreateDto, OrderPostDto } from './dto/order-post.dto.js';
import { OrdersPaginatedReponse } from './dto/orders-paginated.dto.js';
import { PaymentCreateDto } from './dto/payment-create.dto.js';
import { Order } from './entities/order.entity.js';

@UseGuards(ApiKeyAuthGuard)
@ApiTags('Orders')
@ApiSecurity('Api-Key')
@Controller('v2/orders')
@ApiUnauthorizedResponse({
  description: 'You need to be authenticated to access this endpoint.',
  type: ErrorResponse,
})
export class OrdersController {
  constructor(
    private readonly service: OrdersService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(OrdersController.name);
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
  @ApiCreatedResponse({ type: Order })
  @ApiBody({ required: true, type: OrderCreateDto })
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async post(
    @Req() request: CustomersGuardedRequest,
    @Body() body: OrderCreateDto,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
  ) {
    this.logger.verbose(this.post.name);
    const { customer, merchant } = { ...request };
    const { idempotencyKey, locationId, variations } = body;

    if (customer.currentOrderId) {
      throw new BadRequestException(`Current order already exists`);
    }
    if (!merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Access Token`);
    }
    if (!customer.squareId) {
      throw new UnprocessableEntityException(`No Square Customer ID`);
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
        location: location,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Get('current')
  @ApiOkResponse({ type: Order })
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
  ): Promise<Order> {
    this.logger.verbose(this.getCurrent.name);
    const { customer, merchant } = { ...request };

    if (!customer.currentOrderId) {
      throw new NotFoundException(`No current order`);
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
        location: location,
      },
    });
    if (!entity) {
      customer.currentOrderId = undefined;
      await customer.save();

      throw new NotFoundException(`No current order`);
    }

    if (!entity.squareId || !merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Order ID`);
    }

    return entity;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get my Orders',
    operationId: 'getOrders',
  })
  @ApiOkResponse({ type: OrdersPaginatedReponse })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'merchantIdOrPath', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @ApiQuery({ name: 'closed', required: false, type: Boolean })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async getMany(
    @Req() request: UserTypeGuardedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('closed') closed?: boolean,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
  ) {
    this.logger.verbose(
      `${this.getMany.name} merchantId:${request.merchant?.id} customerId: ${request.customer?.id}`,
    );
    return paginatedResults({
      results: await this.service.findAndCount({
        where: {
          customerId: request.customer?.id,
          merchantId: request.merchant?.id,
          closedAt: closed ? Not(IsNull()) : undefined,
        },
        order: { createDate: 'DESC' },
        take: limit,
        skip: (page - 1) * limit,
        relations: {
          lineItems: lineItems
            ? {
                modifiers: lineItems,
              }
            : undefined,
          location: location,
        },
      }),
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get Order',
    operationId: 'getOrder',
  })
  @ApiOkResponse({ type: Order })
  @ApiQuery({ name: 'merchantIdOrPath', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async getOne(
    @Req() request: UserTypeGuardedRequest,
    @Param('id') id: string,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
  ) {
    this.logger.verbose(`${this.getOne.name} id:${id}`);
    const { merchant, customer } = { ...request };
    return await this.service.findOne({
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
        location: location,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Patch('current')
  @ApiOperation({
    summary: 'Patch update Order, e.g. modify Location',
    operationId: 'patchOrderCurrent',
  })
  @ApiOkResponse({ type: Order })
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
    @Body() body: OrderPatchDto,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,

    @Query('idempotencyKey') idempotencyKey?: string,
  ) {
    this.logger.verbose(this.patchCurrent.name);
    const { merchant, customer } = { ...request };
    const currentOrderId = customer.currentOrderId;

    if (!currentOrderId) {
      throw new UnprocessableEntityException(`No current order`);
    }

    if (!(await this.service.exist({ where: { id: currentOrderId } }))) {
      throw new NotFoundException(`Order not found`);
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
        location: location,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Post('current')
  @ApiCreatedResponse({ type: Order })
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
    @Body() body: OrderPostDto,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,

    @Query('idempotencyKey') idempotencyKey?: string,
  ) {
    this.logger.verbose(this.postCurrent.name);
    const { variations } = body;
    const { customer, merchant } = request;
    const currentOrderId = customer.currentOrderId;

    if (!merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Access Token`);
    }
    if (!customer.squareId) {
      throw new UnprocessableEntityException(`No Square Customer ID`);
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
          throw new NotFoundException(`No current order`);
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
      throw new Error(`No order ID`);
    }

    return await this.service.findOne({
      where: { id: returnOrderId },
      relations: {
        lineItems: lineItems
          ? {
              modifiers: lineItems,
            }
          : undefined,
        location: location,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Delete('current/line-item/:id')
  @ApiOkResponse({ type: Order })
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
    this.logger.verbose(this.deleteCurrentLineItem.name);
    const { customer, merchant } = { ...request };
    const squareAccessToken = merchant.squareAccessToken;
    const currentOrderId = customer.currentOrderId;

    if (!currentOrderId) {
      throw new BadRequestException(`No current order`);
    }

    if (!squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Access Token`);
    }

    if (!(await this.service.exist({ where: { id: currentOrderId } }))) {
      throw new NotFoundException(`No current order`);
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
        location: location,
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
    this.logger.verbose(this.deleteCurrent.name);
    const { customer } = request;

    if (!customer.currentOrderId) {
      throw new NotFoundException(`No current order`);
    }

    const entity = await this.service.findOne({
      where: { id: customer.currentOrderId },
    });

    if (!entity) {
      customer.currentOrderId = undefined;
      await customer.save();
      throw new NotFoundException(`No current order`);
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
  @ApiCreatedResponse({ description: 'Payment Successful', type: Order })
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
    @Body() body: PaymentCreateDto,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
  ) {
    this.logger.verbose(this.postCurrentPaymentSquare.name);
    const { customer, merchant } = { ...request };
    const currentOrderId = customer.currentOrderId;

    if (!currentOrderId) {
      customer.currentOrderId = undefined;
      await customer.save();
      throw new NotFoundException(`No current order`);
    }

    if (!(await this.service.exist({ where: { id: currentOrderId } }))) {
      throw new NotFoundException(`No current order`);
    }

    if (!merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Access Token`);
    }

    try {
      await this.service.createPayment({
        orderId: currentOrderId,
        customer,
        input: body,
        merchant,
      });
      return await this.service.findOne({
        where: { id: currentOrderId },
        relations: {
          lineItems: lineItems
            ? {
                modifiers: lineItems,
              }
            : undefined,
          location: location,
        },
      });
    } catch (error: any) {
      this.logger.error(error);
      throw new BadRequestException(error);
    }
  }
}
