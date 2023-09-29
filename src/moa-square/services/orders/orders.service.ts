import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { NestSquareService } from 'nest-square';
import { I18nContext, I18nService } from 'nestjs-i18n';
import {
  ApiResponse,
  OrderLineItem,
  Order as SquareOrder,
  UpdateOrderRequest,
  UpdateOrderResponse,
} from 'square';
import { In, Repository } from 'typeorm';
import { I18nTranslations } from '../../../i18n/i18n.generated.js';
import { UsersService } from '../../../users/users.service.js';
import { EntityRepositoryService } from '../../../utils/entity-repository-service.js';
import { OrdersPostPaymentBody } from '../../dto/orders/payment-create.dto.js';
import { OrdersVariationLineItemInput } from '../../dto/orders/variation-add.dto.js';
import {
  SquareOrderFulfillmentUpdatedPayload,
  isValidFulfillmentStatus,
} from '../../dto/square/square-order-fulfillment-updated.payload.js';
import { CustomerEntity } from '../../entities/customers/customer.entity.js';
import { MerchantEntity } from '../../entities/merchants/merchant.entity.js';
import { OrderEntity } from '../../entities/orders/order.entity.js';
import { ModifiersService } from '../catalogs/modifiers.service.js';
import { VariationsService } from '../catalogs/variations.service.js';
import { CustomersService } from '../customers/customers.service.js';
import { LocationsService } from '../locations/locations.service.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { LineItemService } from './line-item.service.js';

@Injectable()
export class OrdersService extends EntityRepositoryService<OrderEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(OrderEntity)
    protected readonly repository: Repository<OrderEntity>,
    protected readonly i18n: I18nService<I18nTranslations>,
    private readonly lineItemsService: LineItemService,
    private readonly squareService: NestSquareService,
    private readonly locationsService: LocationsService,
    private readonly merchantsService: MerchantsService,
    private readonly usersService: UsersService,
    private readonly customersService: CustomersService,
    private readonly variationsService: VariationsService,
    private readonly modifiersService: ModifiersService,
  ) {
    const logger = new Logger(OrdersService.name);
    super(repository, logger);
    this.logger = logger;
  }

  currentLanguageTranslations() {
    return this.i18n.t('orders', {
      lang: I18nContext.current()?.lang,
    });
  }

  async createOne(params: {
    variations?: OrdersVariationLineItemInput[];
    idempotencyKey?: string;
    customer: CustomerEntity;
    locationId?: string;
    merchant: MerchantEntity;
  }): Promise<OrderEntity> {
    const { variations, merchant, customer } = params;
    this.logger.verbose(this.createOne.name);
    const translations = this.currentLanguageTranslations();
    if (!merchant.squareAccessToken) {
      throw new UnprocessableEntityException(translations.merchantNoSquareId);
    }

    let locationId = params.locationId;

    if (!locationId) {
      if (customer.preferredLocationId) {
        locationId = customer.preferredLocationId;
      } else {
        const squareMainLocation = await this.squareService.retryOrThrow(
          merchant.squareAccessToken,
          (client) => client.locationsApi.retrieveLocation('main'),
        );

        const locationSquareId = squareMainLocation.result.location?.id;
        if (!locationSquareId) {
          throw new UnprocessableEntityException(
            translations.locationNoSquareId,
          );
        }
        const moaMainLocation = await this.locationsService.findOne({
          where: {
            locationSquareId,
            merchantId: merchant.id,
          },
        });
        if (!moaMainLocation) {
          throw new UnprocessableEntityException(translations.noMainLocation);
        }
        locationId = moaMainLocation.id;
      }
    }

    const moaOrder = await this.save(
      this.create({
        customerId: customer.id,
        locationId,
        merchantId: merchant.id,
        squareVersion: 1,
      }),
    );
    moaOrder.lineItems = [];

    let location = await this.locationsService.findOne({
      where: {
        id: locationId,
        merchantId: merchant.id,
      },
    });

    if (!location) {
      throw new NotFoundException(translations.locationNoId);
    }

    const squareOrderLineItems = variations
      ? await this.squareOrderLineItemsFor({
          variations,
        })
      : [];

    try {
      const response = await this.squareService.retryOrThrow(
        merchant.squareAccessToken,
        (client) =>
          client.ordersApi.createOrder({
            idempotencyKey: params.idempotencyKey,
            order: {
              state: 'DRAFT',
              referenceId: moaOrder.id,
              customerId: customer.squareId,
              locationId: location?.locationSquareId ?? 'main',
              lineItems: squareOrderLineItems,
            },
          }),
      );

      const squareOrder = response.result.order;
      if (!squareOrder) {
        throw new InternalServerErrorException(
          translations.invalidResponseFromSquare,
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
          throw new UnprocessableEntityException(translations.locationNoId);
        }
        moaOrder.locationId = location.id;
        moaOrder.location = location;
      }

      await this.saveFromSquareOrder({
        order: moaOrder,
        squareOrder,
      });

      customer.currentOrder = moaOrder;
      await customer.save();
    } catch (error: any) {
      this.logger.error(error);
      await this.remove(moaOrder);
      throw error;
    }

    return moaOrder;
  }

  async updateOne(params: {
    locationMoaId: string;
    merchant: MerchantEntity;
    orderId: string;
    idempotencyKey?: string;
  }) {
    const { locationMoaId, merchant, orderId } = params;
    this.logger.verbose(this.updateOne.name);
    const translations = this.currentLanguageTranslations();

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
      throw new UnprocessableEntityException(
        translations.merchantNoSquareAccessToken,
      );
    }
    const orderSquareId = order.squareId;
    if (!orderSquareId) {
      throw new UnprocessableEntityException(translations.orderNoSquareId);
    }
    const location = await this.locationsService.findOneOrFail({
      where: { id: locationMoaId, merchantId: params.merchant.id },
    });
    const locationSquareId = location.locationSquareId;
    if (!locationSquareId) {
      throw new UnprocessableEntityException(translations.locationNoSquareId);
    }

    if (!location.id) {
      throw new NotFoundException(translations.locationNoId);
    }

    const existingOrderResponse = await this.squareService.retryOrThrow(
      merchant.squareAccessToken,
      (client) => client.ordersApi.retrieveOrder(orderSquareId),
    );

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

    const newSquareOrderResponse = await this.squareService.retryOrThrow(
      merchant.squareAccessToken,
      (client) =>
        client.ordersApi.createOrder({
          order: {
            locationId: locationSquareId,
            lineItems: existingSquareOrderLineItems,
            state: 'DRAFT',
            fulfillments: existingSquareOrder?.fulfillments,
          },
        }),
    );

    const newSquareOrder = newSquareOrderResponse.result.order;

    if (newSquareOrder) {
      order.locationId = location.id;
      order.location = location;
      return await this.saveFromSquareOrder({
        order: order,
        squareOrder: newSquareOrder,
      });
    } else {
      throw new InternalServerErrorException(
        translations.invalidResponseFromSquare,
      );
    }
  }

  async updateMany(params: {
    variations: OrdersVariationLineItemInput[];
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
    this.logger.verbose(this.updateMany.name);
    const translations = this.currentLanguageTranslations();

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

    const orderSquareId = order.squareId;
    if (!orderSquareId) {
      throw new UnprocessableEntityException(translations.orderNoSquareId);
    }
    if (!locationSquareId) {
      throw new UnprocessableEntityException(translations.locationNoSquareId);
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
      const response = await this.squareService.retryOrThrow(
        squareAccessToken,
        (client) =>
          client.ordersApi.updateOrder(orderSquareId, {
            ...squareUpdateBody,
            idempotencyKey,
          }),
      );

      const squareOrder = response.result.order;
      if (squareOrder) {
        return await this.saveFromSquareOrder({
          order,
          squareOrder,
        });
      } else {
        throw new InternalServerErrorException(
          translations.invalidResponseFromSquare,
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
    const { orderId, lineItemIds, squareAccessToken } = params;
    this.logger.verbose(this.removeLineItems.name);
    const translations = this.currentLanguageTranslations();

    const order = await this.findOneOrFail({
      where: { id: orderId },
      relations: {
        lineItems: {
          modifiers: true,
        },
      },
    });

    const orderSquareId = order.squareId;
    if (!orderSquareId) {
      throw new UnprocessableEntityException(translations.orderNoSquareId);
    }
    const location = await this.locationsService.findOne({
      where: { id: order.locationId },
    });
    const locationSquareId = location?.locationSquareId;
    if (!locationSquareId) {
      throw new UnprocessableEntityException(translations.locationNoSquareId);
    }

    const localLineItems = await this.lineItemsService.find({
      where: {
        id: In(lineItemIds),
      },
    });
    const response = await this.squareService.retryOrThrow(
      squareAccessToken,
      (client) =>
        client.ordersApi.updateOrder(orderSquareId, {
          order: {
            locationId: locationSquareId,
            version: order.squareVersion,
          },
          fieldsToClear: localLineItems.map(
            (value) => `line_items[${value.squareUid}]`,
          ),
        }),
    );

    const squareOrder = response.result.order;
    if (squareOrder) {
      return await this.saveFromSquareOrder({
        order,
        squareOrder,
      });
    } else {
      throw new InternalServerErrorException(
        translations.invalidResponseFromSquare,
      );
    }
  }

  async createPaymentOrThrow(params: {
    orderId: string;
    customerId: string;
    input: OrdersPostPaymentBody;
    merchantId: string;
  }) {
    const { orderId, customerId, input, merchantId } = params;
    const {
      pickupDateString,
      paymentSquareId,
      note,
      idempotencyKey,
      orderTipMoney,
      recipient,
    } = input;

    this.logger.verbose(this.createPaymentOrThrow.name);
    const translations = this.currentLanguageTranslations();

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

    const merchant = await this.merchantsService.findOneOrFail({
      where: { id: merchantId },
    });

    const customer = await this.customersService.findOneOrFail({
      where: { id: customerId },
      relations: {
        user: true,
      },
    });

    // TODO: move this to users service and sync with square
    const user = customer.user;
    if (user != undefined) {
      let saveUser = false;
      if (user.firstName == undefined && recipient?.firstName != undefined) {
        user.firstName = recipient.firstName;
        saveUser = true;
      }

      if (user.lastName == undefined && recipient?.lastName != undefined) {
        user.lastName = recipient.lastName;
        saveUser = true;
      }

      if (
        user.phoneNumber == undefined &&
        recipient?.phoneNumber != undefined
      ) {
        user.phoneNumber = recipient.phoneNumber;
        saveUser = true;
      }

      if (saveUser) {
        await this.usersService.save(user);
      }
    }

    let recipientDisplayName = user?.fullName;
    if (recipient?.firstName && recipient?.lastName) {
      recipientDisplayName = `${recipient.firstName} ${recipient.lastName}`;
    }

    const location = order.location;
    const locationSquareId = location?.locationSquareId;
    const locationMoaId = location?.id;
    if (!locationSquareId || !location || !locationMoaId) {
      throw new UnprocessableEntityException(translations.locationNoSquareId);
    }

    const orderSquareId = order.squareId;
    if (!orderSquareId) {
      throw new UnprocessableEntityException(translations.orderNoSquareId);
    }

    if (!merchant.squareAccessToken) {
      throw new UnprocessableEntityException(
        translations.merchantNoSquareAccessToken,
      );
    }

    if (!customer.squareId) {
      throw new UnprocessableEntityException(translations.customerNoSquareId);
    }

    const pickupOrAsapDate = pickupDateString
      ? new Date(pickupDateString)
      : await this.locationsService.firstPickupDateAtLocationWithinDuration({
          locationId: locationMoaId,
          durationMinutes: merchant.pickupLeadDurationMinutes ?? 10,
        });

    await this.locationsService.validatePickupDateTimeOrThrow({
      pickupDate: pickupOrAsapDate,
      id: locationMoaId,
    });

    const squareUpdateOrderResponse: ApiResponse<UpdateOrderResponse> =
      await this.squareService.retryOrThrow(
        merchant.squareAccessToken,
        (client) =>
          client.ordersApi.updateOrder(orderSquareId, {
            order: {
              locationId: locationSquareId,
              version: order.squareVersion,
              state: 'OPEN',
              fulfillments: [
                {
                  type: 'PICKUP',
                  pickupDetails: {
                    note,
                    scheduleType: pickupDateString ? 'SCHEDULED' : 'ASAP',
                    pickupAt: pickupOrAsapDate.toISOString(),
                    recipient: {
                      customerId: customer.squareId,
                      displayName: recipientDisplayName ?? user?.fullName,
                      phoneNumber: recipient?.phoneNumber ?? user?.phoneNumber,
                    },
                  },
                },
              ],
            },
          }),
      );

    const squareOrderFromUpdate = squareUpdateOrderResponse.result.order;
    if (!squareOrderFromUpdate) {
      throw new InternalServerErrorException(
        translations.invalidResponseFromSquare,
      );
    }

    const updatedOrder = await this.saveFromSquareOrder({
      order,
      squareOrder: squareOrderFromUpdate,
    });

    const orderTotalMoney = squareOrderFromUpdate?.totalMoney;
    if (!orderTotalMoney) {
      throw new UnprocessableEntityException(
        translations.invalidResponseFromSquare,
      );
    }

    await this.squareService.retryOrThrow(
      merchant.squareAccessToken,
      (client) =>
        client.paymentsApi.createPayment({
          sourceId: paymentSquareId,
          idempotencyKey: idempotencyKey,
          customerId: customer.squareId ?? undefined,
          locationId: order.location?.locationSquareId,
          amountMoney: orderTotalMoney,
          tipMoney: {
            amount: BigInt(Math.floor(orderTipMoney ?? 0)),
            currency: orderTotalMoney.currency,
          },
          orderId: squareOrderFromUpdate.id,
          referenceId: order.id,
        }),
    );

    updatedOrder.closedDate = new Date();
    updatedOrder.pickupDate = new Date(pickupOrAsapDate);
    updatedOrder.customerId = customer.id;
    updatedOrder.totalMoneyTipAmount = Math.floor(orderTipMoney ?? 0);
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
      return; // Exit if no order_id
    }

    const order = await this.findOne({ where: { squareId: squareOrderId } });
    if (!order) {
      this.logger.error(`Order with id ${squareOrderId} not found`);
      return; // Exit if order not found
    }

    const orderFulfillment = payload?.data?.object?.order_fulfillment_updated;
    const lastFulfillmentUpdate = (
      orderFulfillment?.fulfillment_update ?? []
    ).pop();

    if (lastFulfillmentUpdate) {
      const fulfillmentStatus = lastFulfillmentUpdate.new_state;
      if (fulfillmentStatus && isValidFulfillmentStatus(fulfillmentStatus)) {
        order.squareFulfillmentStatus = fulfillmentStatus;
        await this.save(order);
        this.logger.log("Order's fulfillment status updated");
      }
    }
  }

  async saveFromSquareOrder(params: {
    order: OrderEntity;
    squareOrder: SquareOrder;
  }): Promise<OrderEntity> {
    const { order, squareOrder } = params;
    this.logger.verbose(this.saveFromSquareOrder.name);

    order.squareId = squareOrder?.id;
    order.squareVersion =
      squareOrder?.version ?? (order.squareVersion ?? 0) + 1;

    order.currency = squareOrder?.totalMoney?.currency;
    order.totalMoneyAmount = Number(squareOrder?.totalMoney?.amount);
    order.totalMoneyTaxAmount = Number(squareOrder?.totalTaxMoney?.amount);
    order.totalMoneyDiscountAmount = Number(
      squareOrder?.totalDiscountMoney?.amount,
    );
    order.totalMoneyTipAmount = Number(squareOrder?.totalTipMoney?.amount);
    order.totalMoneyServiceChargeAmount = Number(
      squareOrder?.totalServiceChargeMoney?.amount,
    );

    return this.saveFromSquareLineItems(params);
  }

  async saveFromSquareLineItems(params: {
    order: OrderEntity;
    squareOrder: SquareOrder;
  }) {
    const { order, squareOrder } = params;
    this.logger.verbose(this.saveFromSquareLineItems.name);

    const existingMoaLineItems = order.lineItems ?? [];
    await this.lineItemsService.removeAll(existingMoaLineItems);
    order.lineItems = [];
    const newSquareLineItems = squareOrder?.lineItems ?? [];
    order.lineItems?.push(
      ...newSquareLineItems.map((squareLineItem) => {
        return this.lineItemsService.fromSquareLineItem({ squareLineItem });
      }),
    );
    return await order.save();
  }

  async squareOrderLineItemsFor(params: {
    variations: OrdersVariationLineItemInput[];
  }) {
    this.logger.verbose(this.squareOrderLineItemsFor.name);

    const orderLineItems: OrderLineItem[] = [];
    for (const dto of params.variations) {
      const variation = await this.variationsService.findOne({
        where: { id: dto.id },
      });
      if (!variation?.squareId) {
        throw new UnprocessableEntityException(`Invalid variation`);
      }
      const squareOrderLineItem: OrderLineItem = {
        catalogObjectId: variation?.squareId,
        quantity: `${dto.quantity ?? 1}`,
        modifiers: [],
        note: dto.note,
      };
      if (dto.modifierIds && dto.modifierIds.length > 0) {
        const modifiers = await this.modifiersService.findBy({
          id: In(dto.modifierIds),
        });

        if (modifiers.length !== dto.modifierIds.length) {
          throw new UnprocessableEntityException(`Invalid modifiers`);
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
}
