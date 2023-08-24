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
import { UserTypeEnum } from 'src/users/dto/type-user.dts';
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
    operationId: 'createOrder',
  })
  @ApiUnprocessableEntityResponse({
    description: 'No Square tokens',
    type: NestError,
  })
  @ApiCreatedResponse({ type: Order })
  @ApiBody({ required: true, type: OrderCreateDto })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async create(
    @Req() request: CustomersGuardedRequest,
    @Body() body: OrderCreateDto,
  ) {
    const { customer, merchant } = { ...request };
    const { idempotencyKey, locationId, variations } = body;

    if (request.customer.currentOrderId) {
      throw new BadRequestException(`Current order already exists`);
    }
    if (!request.merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Access Token`);
    }
    if (!request.customer.squareId) {
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
      where: { id: savedOrder.id },
      relations: {
        lineItems: {
          modifiers: true,
        },
        location: {
          address: true,
          businessHours: true,
        },
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
  async getCurrent(@Req() request: CustomersGuardedRequest): Promise<Order> {
    if (!request.customer.currentOrderId) {
      throw new NotFoundException(`No current order`);
    }
    const entity = await this.service.findOne({
      where: { id: request.customer.currentOrderId },
      relations: {
        lineItems: {
          modifiers: true,
        },
        location: {
          address: true,
          businessHours: true,
        },
      },
    });
    if (!entity) {
      request.customer.currentOrderId = undefined;
      await request.customer.save();

      throw new NotFoundException(`No current order`);
    }

    if (!entity.squareId || !request.merchant.squareAccessToken) {
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
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiQuery({ name: 'actingAs', required: false, enum: UserTypeEnum })
  @ApiQuery({ name: 'closed', required: false, type: Boolean })
  @ApiQuery({ name: 'lineItems', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false, type: Boolean })
  @ApiQuery({ name: 'customer', required: false, type: Boolean })
  async getMany(
    @Req() request: UserTypeGuardedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('closed') closed?: boolean,
    @Query('lineItems') lineItems?: boolean,
    @Query('location') location?: boolean,
    @Query('customer') customer?: boolean,
  ) {
    const results = await this.service.findAndCount({
      where: {
        customerId: request.customer?.id,
        merchantId: request.merchant?.id,
        closedAt: closed ? Not(IsNull()) : undefined,
      },
      order: { createDate: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      relations: {
        lineItems: {
          modifiers: lineItems,
        },
        location: location,
        customer: customer,
      },
    });

    return paginatedResults({
      results,
      pagination: { page, limit },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Patch('current')
  @ApiOperation({
    summary: 'Update Order',
    operationId: 'patchCurrentOrder',
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
  async patchUpdateCurrent(
    @Req() request: CustomersGuardedRequest,
    @Body() body: OrderPatchDto,
    @Query('idempotencyKey') idempotencyKey?: string,
  ) {
    const { merchant } = { ...request };

    let order = await this.service.findOneOrFail({
      where: { id: request.customer.currentOrderId },
      relations: {
        location: {
          address: true,
          businessHours: true,
        },
        lineItems: {
          modifiers: true,
        },
      },
    });

    if (body.locationId) {
      order = await this.service.updateAndSaveLocation({
        locationMoaId: body.locationId,
        merchant,
        order,
        idempotencyKey,
      });
    }

    return order;
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
    summary: 'Add Variation to current Order',
    operationId: 'postCurrentOrder',
  })
  @ApiBadRequestResponse({
    description: 'No current order or Invalid variation',
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
  async postUpdateCurrent(
    @Req() request: CustomersGuardedRequest,
    @Body() body: OrderPostDto,
    @Query('idempotencyKey') idempotencyKey?: string,
  ) {
    if (!request.customer.currentOrderId) {
      throw new BadRequestException(`No current order`);
    }
    if (!request.merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Access Token`);
    }

    let order = await this.service.findOneOrFail({
      where: { id: request.customer.currentOrderId },
      relations: {
        location: {
          address: true,
          businessHours: true,
        },
        lineItems: {
          modifiers: true,
        },
      },
    });

    const { variations } = body;
    if (variations && variations.length > 0) {
      order = await this.service.updateAndSaveVariations({
        variations,
        order,
        squareAccessToken: request.merchant.squareAccessToken,
        idempotencyKey,
      });
    }

    return order;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Delete('current/variation/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOperation({
    summary: 'Remove Variation from current Order',
    operationId: 'deleteVariation',
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async deleteCurrentsVariation(
    @Req() request: CustomersGuardedRequest,
    @Param('id') id: string,
  ) {
    // Validation and error checking
    if (!request.customer.currentOrderId) {
      throw new BadRequestException(`No current order`);
    }

    if (!request.merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Access Token`);
    }

    // Load the current order
    const order = await this.service.findOne({
      where: { id: request.customer.currentOrderId },
      relations: {
        location: {
          address: true,
          businessHours: true,
        },
        lineItems: {
          modifiers: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`No current order`);
    }
    await this.service.removeVariations({
      squareAccessToken: request.merchant.squareAccessToken,
      ids: [id],
      order,
    });
    return;
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
    summary: 'Delete current Order',
    operationId: 'deleteCurrentOrder',
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async deleteCurrent(@Req() request: CustomersGuardedRequest): Promise<void> {
    const { customer, merchant } = request;
    if (!customer.currentOrderId) {
      throw new NotFoundException(`No current order`);
    }
    const entity = await this.service.findOneOrFail({
      where: { id: customer.currentOrderId },
      relations: {
        location: {
          address: true,
          businessHours: true,
        },
        lineItems: {
          modifiers: true,
        },
      },
    });

    if (!merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Order ID`);
    }

    await this.service.remove(entity);

    return;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Post('current/payment/square')
  @ApiOperation({
    summary: 'Pay for current Order',
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
  async payForCurrentOrder(
    @Req() request: CustomersGuardedRequest,
    @Body() body: PaymentCreateDto,
  ) {
    const { customer, merchant } = { ...request };

    if (!customer.currentOrderId) {
      throw new NotFoundException(`No current order`);
    }

    const order = await this.service.findOne({
      where: { id: customer.currentOrderId },
      relations: {
        location: {
          address: true,
          businessHours: true,
        },
        lineItems: {
          modifiers: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`No current order`);
    }

    if (!merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Access Token`);
    }

    try {
      return await this.service.createPayment({
        order,
        customer,
        input: body,
        merchant,
      });
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error);
    }
  }
}
