import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OrderLineItem,
  Order as SquareOrder,
  UpdateOrderRequest,
} from 'square';
import { ModifiersService } from 'src/catalogs/services/modifiers.service';
import { VariationsService } from 'src/catalogs/services/variations.service';
import { Customer } from 'src/customers/entities/customer.entity';
import { LocationsService } from 'src/locations/locations.service';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { Order } from 'src/orders/entities/order.entity';
import { SquareService } from 'src/square/square.service';
import { BaseService } from 'src/utils/base-service';
import { In, Repository } from 'typeorm';
import { PaymentCreateDto } from './dto/payment-create.dto';
import { VariationAddDto } from './dto/variation-add.dto';

@Injectable()
export class OrdersService extends BaseService<Order> {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    @InjectRepository(Order)
    protected readonly repository: Repository<Order>,
    protected readonly squareService: SquareService,
    protected readonly locationsService: LocationsService,
    private readonly variationsService: VariationsService,
    private readonly modifiersService: ModifiersService,
  ) {
    super(repository);
  }

  async createAndSaveCurrent(params: {
    idempotencyKey?: string;
    customer: Customer;
    locationId?: string;
    merchant: Merchant;
  }) {
    if (!params.merchant.squareAccessToken) {
      throw new Error('Merchant does not have a Square access token');
    }
    let locationId = params.locationId;

    if (!locationId) {
      const squareMainLocation = await this.squareService.retrieveLocation({
        accessToken: params.merchant.squareAccessToken,
        locationSquareId: 'main',
      });
      const locationSquareId = squareMainLocation.result.location?.id;
      if (!locationSquareId) {
        throw new InternalServerErrorException('No Square Location ID');
      }
      const moaMainLocation = await this.locationsService.findOne({
        where: {
          locationSquareId,
        },
      });
      if (!moaMainLocation) {
        throw new InternalServerErrorException('No MOA Location');
      }
      locationId = moaMainLocation.id;
    }

    let order = await this.createAndSave({
      customerId: params.customer.id,
      locationId,
      merchantId: params.merchant.id,
      squareVersion: 1,
    });

    let location = await this.locationsService.findOne({
      where: {
        id: locationId,
        merchantId: params.merchant.id,
      },
    });

    if (!params.locationId && !location) {
      throw new NotFoundException(`Invalid location ID`);
    }

    try {
      const response = await this.squareService.createOrder({
        accessToken: params.merchant.squareAccessToken,
        body: {
          idempotencyKey: params.idempotencyKey,
          order: {
            state: 'DRAFT',
            referenceId: order.id,
            customerId: params.customer.squareId,
            locationId: location?.locationSquareId ?? 'main',
          },
        },
      });

      const squareOrder = response.result.order;
      if (!squareOrder) {
        throw new InternalServerErrorException(
          `No Square Order returned from Square`,
        );
      }

      if (!location?.locationSquareId) {
        location = await this.locationsService.findOneOrFail({
          where: { locationSquareId: squareOrder.locationId },
        });
        if (!location.id) {
          throw new InternalServerErrorException('No location ID');
        }
        order.locationId = location.id;
      }

      order = await this.updateAndSaveOrderForSquareOrder({
        order,
        squareOrder,
      });
      params.customer.currentOrder = order;
      await params.customer.save();
    } catch (error) {
      await this.remove(order);
      throw error;
    }

    return order;
  }

  async updateAndSaveLocation(params: {
    locationMoaId: string;
    merchant: Merchant;
    order: Order;
    idempotencyKey?: string;
  }) {
    if (!params.merchant.squareAccessToken) {
      throw new UnprocessableEntityException(`No Square Access Token`);
    }
    if (!params.order.squareId) {
      throw new UnprocessableEntityException(`No Square Order ID`);
    }
    const location = await this.locationsService.findOneOrFail({
      where: { id: params.locationMoaId, merchantId: params.merchant.id },
    });
    if (!location.locationSquareId) {
      throw new UnprocessableEntityException(`No Square Location ID`);
    }
    let order = params.order;
    try {
      const existingOrderResponse = await this.squareService.retrieveOrder({
        accessToken: params.merchant.squareAccessToken,
        orderId: params.order.squareId,
      });
      const existingSquareOrder = existingOrderResponse.result.order;
      const existingSquareOrderLineItems = existingSquareOrder?.lineItems?.map(
        (lineItem) => {
          return {
            catalogObjectId: lineItem.catalogObjectId,
            quantity: lineItem.quantity,
            modifiers: lineItem.modifiers?.map((modifier) => {
              return { catalogObjectId: modifier.catalogObjectId };
            }),
          };
        },
      );

      const newSquareOrderResponse = await this.squareService.createOrder({
        accessToken: params.merchant.squareAccessToken,
        body: {
          order: {
            locationId: location.locationSquareId,
            lineItems: existingSquareOrderLineItems,
            state: 'DRAFT',
            fulfillments: existingSquareOrder?.fulfillments,
          },
        },
      });
      const newSquareOrder = newSquareOrderResponse.result.order;

      if (newSquareOrder) {
        order = await this.updateAndSaveOrderForSquareOrder({
          order,
          squareOrder: newSquareOrder,
        });
        order.version = 1;
      }
      if (!location.id) {
        throw new InternalServerErrorException('No location ID');
      }
      order.locationId = location.id;
      return await order.save();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async updateAndSaveVariations(params: {
    locationSquareId: string;
    variations: VariationAddDto[];
    order: Order;
    squareAccessToken: string;
  }) {
    let order = params.order;
    const { locationSquareId, variations, squareAccessToken } = params;
    if (!order.squareId) {
      throw new UnprocessableEntityException(`No Square Order ID`);
    }
    const squareUpdateBody: UpdateOrderRequest = {
      order: {
        locationId: locationSquareId,
        version: order.squareVersion++,
        lineItems: [],
      },
    };

    for (const dto of variations) {
      const variation = await this.variationsService.findOneOrFail({
        where: { id: dto.id },
      });
      if (!variation.squareId) {
        throw new UnprocessableEntityException(`Invalid variation`);
      }
      const squareOrderLineItem: OrderLineItem = {
        catalogObjectId: variation.squareId,
        quantity: `${dto.quantity}`,
        modifiers: [],
      };
      if (dto.modifierIds && dto.modifierIds.length > 0) {
        const modifiers = await this.modifiersService.findBy({
          id: In(dto.modifierIds),
        });

        if (modifiers.length !== dto.modifierIds.length) {
          throw new NotFoundException(`Invalid modifiers`);
        }

        for (const modifier of modifiers) {
          if (!modifier.squareId) {
            throw new UnprocessableEntityException(`Invalid modifier`);
          }
          squareOrderLineItem.modifiers?.push({
            catalogObjectId: modifier.squareId,
          });
        }
      }
      squareUpdateBody.order?.lineItems?.push(squareOrderLineItem);
    }

    try {
      const response = await this.squareService.updateOrder({
        accessToken: squareAccessToken,
        orderId: order.squareId,
        body: squareUpdateBody,
      });
      const squareOrder = response.result.order;
      if (squareOrder) {
        order = await this.updateAndSaveOrderForSquareOrder({
          order,
          squareOrder,
        });
        return order;
      } else {
        throw new InternalServerErrorException(
          `No Square Order returned from Square`,
        );
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async removeVariations(params: {
    uids: string[];
    squareAccessToken: string;
    order: Order;
  }) {
    let order = params.order;
    if (!order.squareId) {
      throw new InternalServerErrorException('No Square Order ID');
    }
    const location = await this.locationsService.findOne({
      where: { id: order.locationId },
    });
    if (!location?.locationSquareId) {
      throw new InternalServerErrorException('No location ID');
    }

    const response = await this.squareService.updateOrder({
      accessToken: params.squareAccessToken,
      orderId: order.squareId,
      body: {
        order: {
          locationId: location?.locationSquareId,
          version: order.squareVersion++,
        },
        fieldsToClear: params.uids.map((uid) => `line_items[${uid}]`),
      },
    });
    const squareOrder = response.result.order;
    if (squareOrder) {
      order = await this.updateAndSaveOrderForSquareOrder({
        order,
        squareOrder,
      });
      return order;
    } else {
      throw new InternalServerErrorException(
        `No Square Order returned from Square`,
      );
    }
  }

  async createPayment(params: {
    order: Order;
    customer: Customer;
    input: PaymentCreateDto;
    merchant: Merchant;
  }) {
    let order = params.order;
    const { customer, input, merchant } = params;
    const location = await this.locationsService.findOne({
      where: { id: order.locationId },
    });

    if (!location?.locationSquareId) {
      throw new NotFoundException('Invalid location');
    }

    if (!order.squareId) {
      throw new NotFoundException('Square ID not found for Order');
    }

    if (!merchant.squareAccessToken) {
      throw new NotFoundException('Square access token not found for Merchant');
    }

    if (!customer.squareId) {
      throw new UnprocessableEntityException(
        "Customer doesn't have a Square ID",
      );
    }

    const squareOrderResponse = await this.squareService.updateOrder({
      accessToken: merchant.squareAccessToken,
      orderId: order.squareId,
      body: {
        order: {
          locationId: location.locationSquareId,
          version: order.squareVersion++,
          state: 'OPEN',
          fulfillments: [
            {
              type: 'PICKUP',
              pickupDetails: {
                scheduleType: 'ASAP',
                pickupAt: new Date(
                  new Date().getTime() + 15 * 60000,
                ).toISOString(),
                recipient: {
                  customerId: params.customer.squareId,
                },
              },
            },
          ],
        },
      },
    });
    const squareOrder = squareOrderResponse.result.order;
    if (!squareOrder) {
      throw new NotFoundException('Square order not found');
    }
    order = await this.updateAndSaveOrderForSquareOrder({
      order,
      squareOrder,
    });

    const orderTotalAmount =
      squareOrder?.netAmounts?.totalMoney?.amount ?? BigInt(0);

    try {
      await this.squareService.createPayment({
        accessToken: merchant.squareAccessToken,
        body: {
          sourceId: input.paymentSquareId,
          idempotencyKey: input.idempotencyKey,
          customerId: customer.squareId,
          locationId: location.locationSquareId,
          amountMoney: {
            amount: orderTotalAmount,
            currency: 'USD',
          },
          tipMoney: {
            amount: BigInt(Math.floor(input.orderTipMoney ?? 0)),
            currency: 'USD',
          },
          orderId: squareOrder.id,
          referenceId: order.id,
        },
      });

      order.customerId = customer.id;
      customer.currentOrderId = undefined;
      await customer.save();

      return this.save(order);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  async updateAndSaveOrderForSquareOrder(params: {
    order: Order;
    squareOrder: SquareOrder;
  }) {
    params.order.squareId = params.squareOrder?.id;
    params.order.squareVersion =
      params.squareOrder?.version ?? params.order.squareVersion++;
    params.order.squareDetails = params.squareOrder as any;

    return params.order.save();
  }
}
