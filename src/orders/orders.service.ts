import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  addDays,
  addHours,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
} from 'date-fns';
import {
  ApiResponse,
  OrderLineItem,
  Order as SquareOrder,
  UpdateOrderRequest,
  UpdateOrderResponse,
} from 'square';
import { ModifiersService } from 'src/catalogs/services/modifiers.service';
import { VariationsService } from 'src/catalogs/services/variations.service';
import { CustomersService } from 'src/customers/customers.service';
import { AppInstall } from 'src/customers/entities/app-install.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { FirebaseAdminService } from 'src/firebase-admin/firebase-admin.service';
import { BusinessHoursPeriod } from 'src/locations/entities/business-hours-period.entity';
import { LocationsService } from 'src/locations/locations.service';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { MerchantsService } from 'src/merchants/merchants.service';
import { Order } from 'src/orders/entities/order.entity';
import { SquareOrderFulfillmentUpdatedPayload } from 'src/square/payloads/square-order-fulfillment-updated.payload';
import { SquareService } from 'src/square/square.service';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { In, Repository } from 'typeorm';
import { PaymentCreateDto } from './dto/payment-create.dto';
import { VariationAddDto } from './dto/variation-add.dto';
import { LineItemService } from './services/line-item.service';

@Injectable()
export class OrdersService extends EntityRepositoryService<Order> {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    @InjectRepository(Order)
    protected readonly repository: Repository<Order>,
    protected readonly lineItemService: LineItemService,
    protected readonly squareService: SquareService,
    protected readonly locationsService: LocationsService,
    protected readonly variationsService: VariationsService,
    protected readonly modifiersService: ModifiersService,
    protected readonly merchantsService: MerchantsService,
    protected readonly customersService: CustomersService,
    protected readonly firebaseAdminService: FirebaseAdminService,
  ) {
    super(repository);
  }

  async createAndSaveCurrent(params: {
    variations?: VariationAddDto[];
    idempotencyKey?: string;
    customer: Customer;
    locationId?: string;
    merchant: Merchant;
  }) {
    const { variations, merchant, customer } = params;
    if (!merchant.squareAccessToken) {
      throw new Error('Merchant does not have a Square access token');
    }
    let locationId = params.locationId;

    if (!locationId) {
      const squareMainLocation = await this.squareService.retrieveLocation({
        accessToken: merchant.squareAccessToken,
        locationSquareId: 'main',
      });
      const locationSquareId = squareMainLocation.result.location?.id;
      if (!locationSquareId) {
        throw new InternalServerErrorException('No Square Location ID');
      }
      const moaMainLocation = await this.locationsService.findOne({
        where: {
          locationSquareId,
          merchantId: merchant.id,
        },
      });
      if (!moaMainLocation) {
        throw new InternalServerErrorException('No MOA Location');
      }
      locationId = moaMainLocation.id;
    }

    let order = await this.save(
      this.create({
        customerId: customer.id,
        locationId,
        merchantId: merchant.id,
        squareVersion: 1,
      }),
    );
    order.lineItems = [];

    let location = await this.locationsService.findOne({
      where: {
        id: locationId,
        merchantId: merchant.id,
      },
    });

    if (!params.locationId && !location) {
      throw new NotFoundException(`Invalid location ID`);
    }

    const squareOrderLineItems = variations
      ? await this.squareOrderLineItemsFor({
          variations,
        })
      : [];

    try {
      const response = await this.squareService.createOrder({
        accessToken: merchant.squareAccessToken,
        body: {
          idempotencyKey: params.idempotencyKey,
          order: {
            state: 'DRAFT',
            referenceId: order.id,
            customerId: customer.squareId,
            locationId: location?.locationSquareId ?? 'main',
            lineItems: squareOrderLineItems,
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
          relations: {
            address: true,
            businessHours: true,
          },
        });
        if (!location.id) {
          throw new InternalServerErrorException('No location ID');
        }
        order.locationId = location.id;
        order.location = location;
      }

      order.lineItems.push(
        ...(squareOrder.lineItems ?? []).map((squareLineItem) => {
          return this.lineItemService.fromSquareLineItem({ squareLineItem });
        }),
      );

      order = await this.updateAndSaveOrderForSquareOrder({
        order,
        squareOrder,
      });
      customer.currentOrder = order;
      await customer.save();
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
      }
      if (!location.id) {
        throw new InternalServerErrorException('No location ID');
      }
      order.locationId = location.id;
      order.location = location;
      return await order.save();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async updateAndSaveVariations(params: {
    variations: VariationAddDto[];
    orderId: string;
    squareAccessToken: string;
    idempotencyKey?: string;
  }) {
    const {
      orderId,
      variations: variationDtos,
      squareAccessToken,
      idempotencyKey,
    } = params;

    let order = await this.findOneOrFail({
      where: { id: orderId },
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

    const locationSquareId = order.location?.locationSquareId;

    if (!order.squareId) {
      throw new UnprocessableEntityException(`No Square Order ID`);
    }
    if (!locationSquareId) {
      throw new UnprocessableEntityException(`No Square Location ID`);
    }

    const newLineItems =
      (await this.squareOrderLineItemsFor({
        variations: variationDtos,
      })) ?? [];
    const squareUpdateBody: UpdateOrderRequest = {
      order: {
        locationId: locationSquareId,
        version: order.squareVersion,
        lineItems: newLineItems,
      },
    };

    try {
      const response = await this.squareService.updateOrder({
        accessToken: squareAccessToken,
        orderId: order.squareId,
        body: { ...squareUpdateBody, idempotencyKey },
      });
      const squareOrder = response.result.order;
      if (squareOrder) {
        const existingSquareLineItemUids = new Set(
          order.lineItems?.map((item) => item.squareUid) ?? [],
        );

        const newSquareOrderLineItems = (squareOrder.lineItems ?? []).filter(
          (squareLineItem) =>
            !existingSquareLineItemUids.has(squareLineItem.uid ?? undefined),
        );

        if (newSquareOrderLineItems.length > 0) {
          const newLineItems = newSquareOrderLineItems.map((squareLineItem) =>
            this.lineItemService.fromSquareLineItem({ squareLineItem }),
          );
          order.lineItems?.push(...newLineItems);
        }

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
    ids: string[];
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

    const localLineItems = await this.lineItemService.find({
      where: {
        id: In(params.ids),
      },
    });
    const response = await this.squareService.updateOrder({
      accessToken: params.squareAccessToken,
      orderId: order.squareId,
      body: {
        order: {
          locationId: location?.locationSquareId,
          version: order.squareVersion,
        },
        fieldsToClear: localLineItems.map(
          (value) => `line_items[${value.squareUid}]`,
        ),
      },
    });
    const squareOrder = response.result.order;
    if (squareOrder) {
      order.lineItems = order.lineItems?.filter((lineItem) => {
        if (lineItem.id) {
          return !params.ids.includes(lineItem.id);
        } else {
          return false;
        }
      });
      await this.lineItemService.removeAll(localLineItems);
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

  async squareOrderLineItemsFor(params: { variations: VariationAddDto[] }) {
    const orderLineItems: OrderLineItem[] = [];
    for (const dto of params.variations) {
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
      orderLineItems.push(squareOrderLineItem);
    }
    return orderLineItems;
  }

  validatePickupTime(pickupAt: string, businessHours: BusinessHoursPeriod[]) {
    const pickupDateTime = new Date(pickupAt);
    const now = new Date();

    if (isBefore(pickupDateTime, now)) {
      throw new BadRequestException('Pickup time is in the past');
    }

    if (isAfter(pickupDateTime, addDays(now, 7))) {
      throw new BadRequestException('Pickup time is too far in the future');
    }

    const pickupTime = format(pickupDateTime, 'HH:mm:ss');
    const pickupDayOfWeek = format(pickupDateTime, 'eee').toUpperCase();

    const matchingPeriod = businessHours.find(
      (period) => period.dayOfWeek === pickupDayOfWeek,
    );

    if (
      !matchingPeriod ||
      !matchingPeriod.startLocalTime ||
      !matchingPeriod.endLocalTime ||
      !(
        pickupTime >= matchingPeriod.startLocalTime &&
        pickupTime <= matchingPeriod.endLocalTime
      )
    ) {
      throw new BadRequestException('Pickup time is not within business hours');
    }
  }

  isWithinHour(date: Date) {
    return isWithinInterval(date, {
      start: new Date(),
      end: addHours(new Date(), 1),
    });
  }

  async createPayment(params: {
    order: Order;
    customer: Customer;
    input: PaymentCreateDto;
    merchant: Merchant;
  }) {
    const { order, customer, input, merchant } = params;
    const { squareAccessToken } = merchant;
    const { pickupAt } = input;

    const location = await this.locationsService.findOne({
      where: { id: order.locationId },
      relations: ['businessHours'],
    });

    if (!location?.locationSquareId) {
      throw new NotFoundException('Invalid location');
    }

    if (!order.squareId) {
      throw new NotFoundException('Square ID not found for Order');
    }

    if (!squareAccessToken) {
      throw new NotFoundException('Square access token not found for Merchant');
    }

    if (!customer.squareId) {
      throw new UnprocessableEntityException(
        "Customer doesn't have a Square ID",
      );
    }

    const businessHours = location?.businessHours ?? [];
    this.validatePickupTime(pickupAt, businessHours);

    const squareRetrieveOrderResponse = await this.squareService.retrieveOrder({
      accessToken: squareAccessToken,
      orderId: order.squareId,
    });
    const squareRetrievedOrder = squareRetrieveOrderResponse.result.order;
    const squareRetrievedOrderHasFulfillment =
      squareRetrievedOrder?.fulfillments &&
      squareRetrievedOrder?.fulfillments?.length > 0;

    let squareUpdateOrderResponse: ApiResponse<UpdateOrderResponse>;
    try {
      squareUpdateOrderResponse = await this.squareService.updateOrder({
        accessToken: squareAccessToken,
        orderId: order.squareId,
        body: {
          order: {
            locationId: location.locationSquareId,
            version: order.squareVersion,
            state: 'OPEN',
            fulfillments: squareRetrievedOrderHasFulfillment
              ? undefined
              : [
                  {
                    type: 'PICKUP',
                    pickupDetails: {
                      scheduleType: this.isWithinHour(new Date(pickupAt))
                        ? 'ASAP'
                        : 'SCHEDULED',
                      pickupAt: pickupAt,
                      recipient: {
                        customerId: customer.squareId,
                      },
                    },
                  },
                ],
          },
        },
      });
    } catch (error) {
      this.logger.error('Error updating Square order:', error);
      throw new InternalServerErrorException(
        error,
        'Failed to update Square order',
      );
    }

    const squareOrderFromUpdate = squareUpdateOrderResponse.result.order;
    if (!squareOrderFromUpdate) {
      throw new NotFoundException('Square order not found');
    }

    const updatedOrder = await this.updateAndSaveOrderForSquareOrder({
      order,
      squareOrder: squareOrderFromUpdate,
    });

    const orderTotalAmount =
      squareOrderFromUpdate?.totalMoney?.amount ?? BigInt(0);

    try {
      await this.squareService.createPayment({
        accessToken: squareAccessToken,
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
          orderId: squareOrderFromUpdate.id,
          referenceId: order.id,
        },
      });

      updatedOrder.closedAt = new Date();
      updatedOrder.customerId = customer.id;
      updatedOrder.totalMoneyTipAmount = Math.floor(input.orderTipMoney ?? 0);
      customer.currentOrder = null;
      await customer.save();

      return this.save(updatedOrder);
    } catch (error) {
      this.logger.error('Error creating Square payment:', error);
      throw new InternalServerErrorException('Failed to create Square payment');
    }
  }

  async updateAndSaveOrderForSquareOrder(params: {
    order: Order;
    squareOrder: SquareOrder;
  }) {
    params.order.squareId = params.squareOrder?.id;
    params.order.squareVersion =
      params.squareOrder?.version ?? params.order.squareVersion + 1;

    params.order.currency = params.squareOrder?.totalMoney?.currency;
    params.order.totalMoneyAmount = Number(
      params.squareOrder?.totalMoney?.amount,
    );
    params.order.totalMoneyTaxAmount = Number(
      params.squareOrder?.totalTaxMoney?.amount,
    );
    params.order.totalMoneyDiscountAmount = Number(
      params.squareOrder?.totalDiscountMoney?.amount,
    );
    params.order.totalMoneyTipAmount = Number(
      params.squareOrder?.totalTipMoney?.amount,
    );
    params.order.totalMoneyServiceChargeAmount = Number(
      params.squareOrder?.totalServiceChargeMoney?.amount,
    );

    return params.order.save();
  }

  @OnEvent('square.order.fulfillment.updated')
  async handleSquareOrderFulfillmentUpdate(
    payload: SquareOrderFulfillmentUpdatedPayload,
  ) {
    const squareOrderId =
      payload.data.object.order_fulfillment_updated.order_id;
    if (!squareOrderId) {
      this.logger.error(
        `Missing order_id in SquareOrderFulfillmentUpdatedPayload`,
      );
    }
    const order = await this.findOne({ where: { squareId: squareOrderId } });
    if (!order) {
      this.logger.error(`Order with id ${squareOrderId} not found`);
      return;
    }

    if (!payload.merchant_id) {
      this.logger.error(
        'Missing merchant_id in SquareLocationCreatedEventPayload',
      );
      return;
    }

    const merchant = await this.findOne({
      where: { squareId: payload.merchant_id },
    });
    if (!merchant) {
      this.logger.error(`Merchant with id ${payload.merchant_id} not found`);
      return;
    }

    const app = this.merchantsService.firebaseAdminApp({ merchant });
    if (!app) {
      this.logger.error(`Firebase app not found for merchant ${merchant.id}`);
      return;
    }

    const customer = await this.loadOneRelation<Customer>(order, 'customer');
    if (!customer) {
      this.logger.error(`Customer not found for order ${order.id}`);
      return;
    }

    const appInstalls =
      await this.customersService.loadManyRelation<AppInstall>(
        customer,
        'appInstalls',
      );

    const messaging = this.firebaseAdminService.messaging(app);
    const orderFulfillment = payload.data.object.order_fulfillment_updated;
    const latestUpdate =
      orderFulfillment.fulfillment_update[
        orderFulfillment.fulfillment_update.length - 1
      ];
    const body = `Your order with ID ${order.id} has been updated from ${latestUpdate.old_state} to ${latestUpdate.new_state}.`;

    for (const appInstall of appInstalls) {
      if (!appInstall.firebaseCloudMessagingToken) {
        continue;
      }
      await messaging.send({
        token: appInstall.firebaseCloudMessagingToken,
        notification: {
          title: 'Order Update',
          body,
        },
      });
    }
  }
}
