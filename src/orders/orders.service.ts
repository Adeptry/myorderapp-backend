import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';

import { ApiResponse, UpdateOrderRequest, UpdateOrderResponse } from 'square';
import { In, Repository } from 'typeorm';
import { ModifiersService } from '../catalogs/services/modifiers.service.js';
import { VariationsService } from '../catalogs/services/variations.service.js';
import { CustomersService } from '../customers/customers.service.js';
import { AppInstall } from '../customers/entities/app-install.entity.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service.js';
import { LocationsService } from '../locations/locations.service.js';
import { AppLogger } from '../logger/app.logger.js';
import { Merchant } from '../merchants/entities/merchant.entity.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { Order } from '../orders/entities/order.entity.js';
import { SquareOrderFulfillmentUpdatedPayload } from '../square/payloads/square-order-fulfillment-updated.payload.js';
import { SquareService } from '../square/square.service.js';
import { EntityRepositoryService } from '../utils/entity-repository-service.js';
import { PaymentCreateDto } from './dto/payment-create.dto.js';
import { VariationAddDto } from './dto/variation-add.dto.js';
import { OrdersUtils } from './orders.utils.js';
import { LineItemService } from './services/line-item.service.js';

@Injectable()
export class OrdersService extends EntityRepositoryService<Order> {
  constructor(
    @InjectRepository(Order)
    protected readonly repository: Repository<Order>,
    protected readonly lineItemsService: LineItemService,
    protected readonly squareService: SquareService,
    protected readonly locationsService: LocationsService,
    protected readonly variationsService: VariationsService,
    protected readonly modifiersService: ModifiersService,
    protected readonly merchantsService: MerchantsService,
    protected readonly customersService: CustomersService,
    protected readonly firebaseAdminService: FirebaseAdminService,
    private readonly utils: OrdersUtils,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(OrdersService.name);
    super(repository, logger);
  }

  async createOne(params: {
    variations?: VariationAddDto[];
    idempotencyKey?: string;
    customer: Customer;
    locationId?: string;
    merchant: Merchant;
  }): Promise<Order> {
    this.logger.verbose(this.createOne.name);
    const { variations, merchant, customer } = params;
    if (!merchant.squareAccessToken) {
      throw new Error('Merchant does not have a Square access token');
    }

    let locationId = params.locationId;

    if (!locationId) {
      if (customer.preferredLocationId) {
        locationId = customer.preferredLocationId;
      } else {
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
    }

    const order = await this.save(
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
      ? await this.utils.squareOrderLineItemsFor({
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

      await this.utils.updateForSquareOrder({
        order,
        squareOrder,
      });

      customer.currentOrder = order;
      await customer.save();
    } catch (error: any) {
      this.logger.error(error);
      await this.remove(order);
      throw error;
    }

    return order;
  }

  async updateOne(params: {
    locationMoaId: string;
    merchant: Merchant;
    orderId: string;
    idempotencyKey?: string;
  }) {
    this.logger.verbose(this.updateOne.name);
    const { locationMoaId, merchant, orderId } = params;

    const order = await this.findOneOrFail({
      where: { id: orderId },
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
      throw new UnprocessableEntityException(`No Square Access Token`);
    }
    if (!order.squareId) {
      throw new UnprocessableEntityException(`No Square Order ID`);
    }
    const location = await this.locationsService.findOneOrFail({
      where: { id: locationMoaId, merchantId: params.merchant.id },
    });
    if (!location.locationSquareId) {
      throw new UnprocessableEntityException(`No Square Location ID`);
    }

    if (!location.id) {
      throw new InternalServerErrorException('No location ID');
    }

    const existingOrderResponse = await this.squareService.retrieveOrder({
      accessToken: merchant.squareAccessToken,
      orderId: order.squareId,
    });
    const existingSquareOrder = existingOrderResponse.result.order;
    const existingSquareOrderLineItems = existingSquareOrder?.lineItems?.map(
      (lineItem) => {
        return {
          catalogObjectId: lineItem.catalogObjectId,
          quantity: lineItem.quantity,
          note: lineItem.note,
          modifiers: lineItem.modifiers?.map((modifier) => {
            return { catalogObjectId: modifier.catalogObjectId };
          }),
        };
      },
    );

    const newSquareOrderResponse = await this.squareService.createOrder({
      accessToken: merchant.squareAccessToken,
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
      order.locationId = location.id;
      order.location = location;
      return await this.utils.updateForSquareOrder({
        order: order,
        squareOrder: newSquareOrder,
      });
    } else {
      throw new InternalServerErrorException('No Square Order returned');
    }
  }

  async updateMany(params: {
    variations: VariationAddDto[];
    orderId: string;
    squareAccessToken: string;
    idempotencyKey?: string;
  }) {
    this.logger.verbose(this.updateMany.name);
    const {
      orderId,
      variations: variationDtos,
      squareAccessToken,
      idempotencyKey,
    } = params;

    const order = await this.findOneOrFail({
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
      (await this.utils.squareOrderLineItemsFor({
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
        return await this.utils.updateForSquareOrder({
          order,
          squareOrder,
        });
      } else {
        throw new InternalServerErrorException(
          `No Square Order returned from Square`,
        );
      }
    } catch (error: any) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  async removeLineItems(params: {
    lineItemIds: string[];
    squareAccessToken: string;
    orderId: string;
  }) {
    this.logger.verbose(this.removeLineItems.name);
    const { orderId, lineItemIds, squareAccessToken } = params;

    const order = await this.findOneOrFail({
      where: { id: orderId },
      relations: {
        lineItems: {
          modifiers: true,
        },
      },
    });

    if (!order.squareId) {
      throw new InternalServerErrorException('No Square Order ID');
    }
    const location = await this.locationsService.findOne({
      where: { id: order.locationId },
    });
    if (!location?.locationSquareId) {
      throw new InternalServerErrorException('No location ID');
    }

    const localLineItems = await this.lineItemsService.find({
      where: {
        id: In(lineItemIds),
      },
    });
    const response = await this.squareService.updateOrder({
      accessToken: squareAccessToken,
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
      return await this.utils.updateForSquareOrder({
        order,
        squareOrder,
      });
    } else {
      throw new InternalServerErrorException(
        `No Square Order returned from Square`,
      );
    }
  }

  async createPayment(params: {
    orderId: string;
    customer: Customer;
    input: PaymentCreateDto;
    merchant: Merchant;
  }) {
    this.logger.verbose(this.createPayment.name);
    const { orderId, customer, input, merchant } = params;
    const { squareAccessToken } = merchant;
    const { pickupAt } = input;

    const order = await this.findOneOrFail({
      where: { id: orderId },
      relations: {
        lineItems: {
          modifiers: true,
        },
        location: {
          businessHours: true,
        },
      },
    });

    if (!order.location?.locationSquareId) {
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

    this.utils.validatePickupTime(
      pickupAt,
      order.location?.businessHours ?? [],
    );

    const squareRetrieveOrderResponse = await this.squareService.retrieveOrder({
      accessToken: squareAccessToken,
      orderId: order.squareId,
    });
    const squareRetrievedOrder = squareRetrieveOrderResponse.result.order;
    const squareRetrievedOrderHasFulfillment =
      squareRetrievedOrder?.fulfillments &&
      squareRetrievedOrder?.fulfillments?.length > 0;

    const squareUpdateOrderResponse: ApiResponse<UpdateOrderResponse> =
      await this.squareService.updateOrder({
        accessToken: squareAccessToken,
        orderId: order.squareId,
        body: {
          order: {
            locationId: order.location.locationSquareId,
            version: order.squareVersion,
            state: 'OPEN',
            fulfillments: squareRetrievedOrderHasFulfillment
              ? undefined
              : [
                  {
                    type: 'PICKUP',
                    pickupDetails: {
                      scheduleType: this.utils.isWithinHour(new Date(pickupAt))
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

    const squareOrderFromUpdate = squareUpdateOrderResponse.result.order;
    if (!squareOrderFromUpdate) {
      throw new NotFoundException('Square order not found');
    }

    const updatedOrder = await this.utils.updateForSquareOrder({
      order,
      squareOrder: squareOrderFromUpdate,
    });

    const orderTotalMoney = squareOrderFromUpdate?.totalMoney;
    if (!orderTotalMoney) {
      throw new UnprocessableEntityException('Invalid order total amount');
    }

    await this.squareService.createPayment({
      accessToken: squareAccessToken,
      body: {
        sourceId: input.paymentSquareId,
        idempotencyKey: input.idempotencyKey,
        customerId: customer.squareId,
        locationId: order.location.locationSquareId,
        amountMoney: orderTotalMoney,
        tipMoney: {
          amount: BigInt(Math.floor(input.orderTipMoney ?? 0)),
          currency: orderTotalMoney.currency,
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
  }

  @OnEvent('square.order.fulfillment.updated')
  async handleSquareOrderFulfillmentUpdate(
    payload: SquareOrderFulfillmentUpdatedPayload,
  ) {
    this.logger.verbose(this.handleSquareOrderFulfillmentUpdate.name);
    const squareOrderId =
      payload.data?.object?.order_fulfillment_updated?.order_id;
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
    const orderFulfillment = payload?.data?.object?.order_fulfillment_updated;
    const latestUpdate = (orderFulfillment?.fulfillment_update ?? [])[
      (orderFulfillment?.fulfillment_update?.length ?? 0) - 1
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
