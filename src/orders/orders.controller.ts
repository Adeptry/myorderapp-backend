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
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import {
  CustomersGuard,
  CustomersGuardedRequest,
} from 'src/guards/customers.guard';
import {
  UserTypeGuard,
  UserTypeGuardedRequest,
} from 'src/guards/user-type.guard';
import { OrdersService } from 'src/orders/orders.service';
import { UserTypeEnum } from 'src/users/dto/type-user.dto';
import { NestError } from 'src/utils/error';
import { paginatedResults } from 'src/utils/paginated';
import { IsNull, Not } from 'typeorm';
import { OrderPatchDto } from './dto/order-patch.dto';
import { OrderCreateDto, OrderPostDto } from './dto/order-post.dto';
import { OrdersPaginatedReponse } from './dto/orders-paginated.dto';
import { PaymentCreateDto } from './dto/payment-create.dto';
import { Order } from './entities/order.entity';

@UseGuards(ApiKeyAuthGuard)
@ApiTags('Orders')
@ApiSecurity('Api-Key')
@Controller('v2/orders')
@ApiUnauthorizedResponse({
  description: 'You need to be authenticated to access this endpoint.',
  type: NestError,
})
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly service: OrdersService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Post()
  @ApiBadRequestResponse({
    description: 'Current order already exists',
    type: NestError,
  })
  @ApiNotFoundResponse({ description: 'Invalid location ID', type: NestError })
  @ApiOperation({
    summary: 'Create Order',
    operationId: 'createCurrentOrder',
  })
  @ApiUnprocessableEntityResponse({
    description: 'No Square tokens',
    type: NestError,
  })
  @ApiCreatedResponse({ type: Order })
  @ApiBody({ required: true, type: OrderCreateDto })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async createCurrent(
    @Req() request: CustomersGuardedRequest,
    @Body() body: OrderCreateDto,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
  ) {
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

    const savedOrder = await this.service.createAndSaveCurrent({
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
    operationId: 'getCurrentOrder',
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async getCurrent(
    @Req() request: CustomersGuardedRequest,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
  ): Promise<Order> {
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
  @Get(':id')
  @ApiOperation({
    summary: 'Get Order',
    operationId: 'getOrder',
  })
  @ApiOkResponse({ type: Order })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
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
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get my Orders',
    operationId: 'getOrders',
  })
  @ApiOkResponse({ type: OrdersPaginatedReponse })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
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
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Patch('current')
  @ApiOperation({
    summary: 'Patch update Order, e.g. modify Location',
    operationId: 'patchUpdateCurrentOrder',
  })
  @ApiOkResponse({ type: Order })
  @ApiBadRequestResponse({ description: 'Order not found', type: NestError })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid location ID',
    type: NestError,
  })
  @ApiInternalServerErrorResponse({
    description: 'Square error',
    type: NestError,
  })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
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
    const { merchant, customer } = { ...request };
    const { currentOrderId } = { ...customer };

    if (!currentOrderId) {
      throw new UnprocessableEntityException(`No current order`);
    }

    if (!(await this.service.exist({ where: { id: currentOrderId } }))) {
      throw new NotFoundException(`Order not found`);
    }

    if (body.locationId) {
      await this.service.updateAndSaveLocation({
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
    type: NestError,
  })
  @ApiOperation({
    summary: 'Post update Order, e.g. add Variations & Modifiers in Line Items',
    operationId: 'postUpdateCurrentOrder',
  })
  @ApiBadRequestResponse({
    description: 'No current Order or Invalid variation',
    type: NestError,
  })
  @ApiUnprocessableEntityResponse({
    description: 'No Square Order ID or Square Access Token',
    type: NestError,
  })
  @ApiInternalServerErrorResponse({
    description: 'Square error',
    type: NestError,
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
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
    const { variations } = body;
    const { customer, merchant } = request;
    const { currentOrderId } = { ...customer };

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
          await this.service.updateAndSaveVariations({
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
          await this.service.createAndSaveCurrent({
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
    type: NestError,
  })
  @ApiOperation({
    summary: 'Remove Line Items from Order',
    operationId: 'deleteCurrentLineItem',
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
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
    const { squareAccessToken } = { ...merchant };
    const { currentOrderId } = { ...customer };

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
    type: NestError,
  })
  @ApiNoContentResponse({ description: 'Order Deleted Successfully' })
  @ApiOperation({
    summary: 'Delete Order',
    operationId: 'deleteCurrentOrder',
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async deleteCurrent(@Req() request: CustomersGuardedRequest): Promise<void> {
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
    operationId: 'postPaymentForCurrentOrder',
  })
  @ApiCreatedResponse({ description: 'Payment Successful', type: Order })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiNotFoundResponse({ description: 'No current order', type: NestError })
  @ApiUnprocessableEntityResponse({
    description: 'No Square Access Token',
    type: NestError,
  })
  @ApiBadRequestResponse({
    description: 'Invalid pickup time',
    type: NestError,
  })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  async postPaymentForCurrent(
    @Req() request: CustomersGuardedRequest,
    @Body() body: PaymentCreateDto,
    @Query('lineItems', new DefaultValuePipe(false), ParseBoolPipe)
    lineItems?: boolean,
    @Query('location', new DefaultValuePipe(false), ParseBoolPipe)
    location?: boolean,
  ) {
    const { customer, merchant } = { ...request };
    const { currentOrderId } = { ...customer };

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
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error);
    }
  }
}
