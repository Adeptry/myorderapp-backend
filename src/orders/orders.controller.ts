import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
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
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  CustomersGuard,
  CustomersGuardedRequest,
} from 'src/guards/customers.guard';
import { OrdersService } from 'src/orders/orders.service';
import { SquareService } from 'src/square/square.service';
import { NestError } from 'src/utils/error';
import { paginatedResults } from 'src/utils/paginated';
import { OrderPatchDto } from './dto/order-patch.dto';
import { OrderPostDto } from './dto/order-post.dto';
import { PaymentCreateDto } from './dto/payment-create.dto';
import { Order } from './entities/order.entity';

@ApiTags('Orders')
@Controller('v2/orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly service: OrdersService,
    private readonly squareService: SquareService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Post()
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiBadRequestResponse({
    description: 'Current order already exists',
    type: NestError,
  })
  @ApiUnprocessableEntityResponse({
    description: 'No Square tokens',
    type: NestError,
  })
  @ApiNotFoundResponse({ description: 'Invalid location ID', type: NestError })
  @ApiOperation({
    summary: 'Create Order',
    operationId: 'createOrder',
  })
  @ApiCreatedResponse({ type: Order })
  @ApiQuery({ name: 'idempotencyKey', required: false, type: String })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async create(
    @Req() request: CustomersGuardedRequest,
    @Query('locationId') locationId?: string,
    @Query('idempotencyKey') idempotencyKey?: string,
  ) {
    const { customer, merchant } = { ...request };

    if (request.customer.currentOrderId) {
      throw new BadRequestException(`Current order already exists`);
    }
    if (!request.merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Access Token`);
    }
    if (!request.customer.squareId) {
      throw new UnprocessableEntityException(`No Square Customer ID`);
    }

    return this.service.createAndSaveCurrent({
      idempotencyKey,
      customer,
      locationId,
      merchant,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Get('current')
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOkResponse({ type: Order })
  @ApiOperation({
    summary: 'Get current Order',
    operationId: 'getCurrent',
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async getCurrent(@Req() request: CustomersGuardedRequest): Promise<Order> {
    if (!request.customer.currentOrderId) {
      throw new NotFoundException(`No current order`);
    }
    const entity = await this.service.findOne({
      where: { id: request.customer.currentOrderId },
    });
    if (!entity) {
      request.customer.currentOrderId = undefined;
      await request.customer.save();

      throw new NotFoundException(`No current order`);
    }

    if (!entity.squareId || !request.merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Order ID`);
    }
    const response = await this.squareService.retrieveOrder({
      accessToken: request.merchant.squareAccessToken,
      orderId: entity.squareId,
    });
    entity.squareDetails = response.result.order as any;
    return entity;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Get()
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOperation({
    summary: 'Get my Orders',
    operationId: 'getMyOrders',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async get(
    @Req() request: CustomersGuardedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const results = await this.service.findAndCount({
      where: {
        customerId: request.customer.id,
      },
      order: { createDate: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    for (const order of results[0]) {
      if (!order.squareId || !request.merchant.squareAccessToken) {
        throw new UnprocessableEntityException(`No Square Order ID`);
      }
      const response = await this.squareService.retrieveOrder({
        accessToken: request.merchant.squareAccessToken,
        orderId: order.squareId,
      });
      order.squareDetails = response.result.order as any;
    }

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
    operationId: 'patchUpdateCurrent',
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
  @ApiQuery({ name: 'idempotencyKey', required: false, type: String })
  async patchUpdateCurrent(
    @Req() request: CustomersGuardedRequest,
    @Body() body: OrderPatchDto,
    @Query('idempotencyKey') idempotencyKey?: string,
  ) {
    const { merchant } = { ...request };

    let order = await this.service.findOneOrThrowNotFound({
      where: { id: request.customer.currentOrderId },
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
    operationId: 'postUpdateCurrent',
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
    const { merchant } = { ...request };
    if (!request.customer.currentOrderId) {
      throw new BadRequestException(`No current order`);
    }
    if (!request.merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Access Token`);
    }

    let order = await this.service.findOneOrThrowNotFound({
      where: { id: request.customer.currentOrderId },
      relations: ['location'],
    });

    let locationSquareId = order.location?.locationSquareId ?? 'main';
    if (body.locationId && body.locationId !== order.location?.id) {
      order = await this.service.updateAndSaveLocation({
        locationMoaId: body.locationId,
        merchant,
        order,
        idempotencyKey,
      });
      locationSquareId = order.location?.locationSquareId ?? 'main';
    }

    const { variations } = body;
    if (variations && variations.length > 0) {
      order = await this.service.updateAndSaveVariations({
        locationSquareId,
        variations,
        order,
        squareAccessToken: request.merchant.squareAccessToken,
      });
    }

    return order;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Delete('current/variation/:uid')
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOperation({
    summary: 'Remove Variation from current Order',
    operationId: 'deleteCurrentsVariation',
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async deleteCurrentsVariation(
    @Req() request: CustomersGuardedRequest,
    @Param('uid') uid: string,
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
    });

    if (!order) {
      throw new NotFoundException(`No current order`);
    }

    return this.service.removeVariations({
      squareAccessToken: request.merchant.squareAccessToken,
      uids: [uid],
      order,
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
    summary: 'Delete current Order',
    operationId: 'deleteCurrent',
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  async deleteCurrent(@Req() request: CustomersGuardedRequest): Promise<void> {
    if (!request.customer.currentOrderId) {
      throw new NotFoundException(`No current order`);
    }
    const entity = await this.service.findOneOrThrowNotFound({
      where: { id: request.customer.currentOrderId },
    });

    if (!request.merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Order ID`);
    }

    await this.service.remove(entity);
    request.customer.currentOrderId = undefined;
    await request.customer.save();

    return;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @Post('current/payment')
  @ApiOperation({
    summary: 'Pay for current Order',
    operationId: 'payForCurrentOrder',
  })
  @ApiOkResponse({ description: 'Payment Successful' })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiQuery({ name: 'merchantId', required: true, type: String })
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
      throw new InternalServerErrorException(error);
    }
  }
}
