import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { addMinutes } from 'date-fns';
import { NestSquareService } from 'nest-square';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiResponse, UpdateOrderRequest, UpdateOrderResponse } from 'square';
import { In, Repository } from 'typeorm';
import { FirebaseAdminService } from '../../../firebase-admin/firebase-admin.service.js';
import { I18nTranslations } from '../../../i18n/i18n.generated.js';
import { UsersService } from '../../../users/users.service.js';
import { EntityRepositoryService } from '../../../utils/entity-repository-service.js';
import { OrdersPostPaymentBody } from '../../dto/orders/payment-create.dto.js';
import { OrdersVariationLineItemInput } from '../../dto/orders/variation-add.dto.js';
import { SquareOrderFulfillmentUpdatedPayload } from '../../dto/square/square-order-fulfillment-updated.payload.js';
import { AppInstall } from '../../entities/customers/app-install.entity.js';
import { CustomerEntity } from '../../entities/customers/customer.entity.js';
import { MerchantEntity } from '../../entities/merchants/merchant.entity.js';
import { OrderEntity } from '../../entities/orders/order.entity.js';
import { CustomersService } from '../customers/customers.service.js';
import { LocationsService } from '../locations/locations.service.js';
import { MerchantsFirebaseService } from '../merchants/merchants.firebase.service.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { LineItemService } from './line-item.service.js';
import { OrdersUtils } from './orders.utils.js';

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
    private readonly merchantsFirebaseService: MerchantsFirebaseService,
    private readonly customersService: CustomersService,
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly utils: OrdersUtils,
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
      ? await this.utils.squareOrderLineItemsFor({
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

      await this.utils.saveFromSquareOrder({
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
      throw new InternalServerErrorException(translations.locationNoId);
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
      return await this.utils.saveFromSquareOrder({
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
        return await this.utils.saveFromSquareOrder({
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
      return await this.utils.saveFromSquareOrder({
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
      pickupDate,
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

    const locationSquareId = order.location?.locationSquareId;
    if (!locationSquareId) {
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

    const pickupOrAsapDate =
      pickupDate ?? addMinutes(new Date(), 15).toISOString();

    this.utils.validatePickupTimeOrThrow({
      pickupDate: pickupOrAsapDate,
      businessHours: order.location?.businessHours ?? [],
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
                    scheduleType: pickupDate ? 'SCHEDULED' : 'ASAP',
                    pickupAt: pickupOrAsapDate,
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

    const updatedOrder = await this.utils.saveFromSquareOrder({
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

    const app = this.merchantsFirebaseService.firebaseAdminApp({ merchant });
    if (!app) {
      this.logger.error(`Firebase app not found for merchant ${merchant.id}`);
      return;
    }

    const customer = await this.loadOneRelation<CustomerEntity>(
      order,
      'customer',
    );
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
