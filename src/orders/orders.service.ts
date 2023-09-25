import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { addMinutes } from 'date-fns';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiResponse, UpdateOrderRequest, UpdateOrderResponse } from 'square';
import { In, Repository } from 'typeorm';
import { CustomersService } from '../customers/customers.service.js';
import { AppInstall } from '../customers/entities/app-install.entity.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service.js';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { LocationsService } from '../locations/locations.service.js';
import { AppLogger } from '../logger/app.logger.js';
import { Merchant } from '../merchants/entities/merchant.entity.js';
import { MerchantsFirebaseService } from '../merchants/merchants.firebase.service.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { Order } from '../orders/entities/order.entity.js';
import { SquareOrderFulfillmentUpdatedPayload } from '../square/payloads/square-order-fulfillment-updated.payload.js';
import { SquareService } from '../square/square.service.js';
import { UsersService } from '../users/users.service.js';
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
    protected readonly logger: AppLogger,
    protected readonly i18n: I18nService<I18nTranslations>,
    private readonly lineItemsService: LineItemService,
    private readonly squareService: SquareService,
    private readonly locationsService: LocationsService,
    private readonly merchantsService: MerchantsService,
    private readonly usersService: UsersService,
    private readonly merchantsFirebaseService: MerchantsFirebaseService,
    private readonly customersService: CustomersService,
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly utils: OrdersUtils,
  ) {
    logger.setContext(OrdersService.name);
    super(repository, logger);
  }

  currentLanguageTranslations() {
    return this.i18n.t('orders', {
      lang: I18nContext.current()?.lang,
    });
  }

  async createOne(params: {
    variations?: VariationAddDto[];
    idempotencyKey?: string;
    customer: Customer;
    locationId?: string;
    merchant: Merchant;
  }): Promise<Order> {
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
        const squareMainLocation =
          await this.squareService.retrieveLocationOrThrow({
            accessToken: merchant.squareAccessToken,
            locationSquareId: 'main',
          });
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
      const response = await this.squareService.createOrderOrThrow({
        accessToken: merchant.squareAccessToken,
        body: {
          idempotencyKey: params.idempotencyKey,
          order: {
            state: 'DRAFT',
            referenceId: moaOrder.id,
            customerId: customer.squareId,
            locationId: location?.locationSquareId ?? 'main',
            lineItems: squareOrderLineItems,
          },
        },
      });

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
    merchant: Merchant;
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
    if (!order.squareId) {
      throw new UnprocessableEntityException(translations.orderNoSquareId);
    }
    const location = await this.locationsService.findOneOrFail({
      where: { id: locationMoaId, merchantId: params.merchant.id },
    });
    if (!location.locationSquareId) {
      throw new UnprocessableEntityException(translations.locationNoSquareId);
    }

    if (!location.id) {
      throw new InternalServerErrorException(translations.locationNoId);
    }

    const existingOrderResponse = await this.squareService.retrieveOrderOrThrow(
      {
        accessToken: merchant.squareAccessToken,
        orderId: order.squareId,
      },
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

    const newSquareOrderResponse = await this.squareService.createOrderOrThrow({
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

    if (!order.squareId) {
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
      const response = await this.squareService.updateOrderOrThrow({
        accessToken: squareAccessToken,
        orderId: order.squareId,
        body: { ...squareUpdateBody, idempotencyKey },
      });
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

    if (!order.squareId) {
      throw new UnprocessableEntityException(translations.orderNoSquareId);
    }
    const location = await this.locationsService.findOne({
      where: { id: order.locationId },
    });
    if (!location?.locationSquareId) {
      throw new UnprocessableEntityException(translations.locationNoSquareId);
    }

    const localLineItems = await this.lineItemsService.find({
      where: {
        id: In(lineItemIds),
      },
    });
    const response = await this.squareService.updateOrderOrThrow({
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
    input: PaymentCreateDto;
    merchantId: string;
  }) {
    const { orderId, customerId, input, merchantId } = params;
    const {
      pickupDateTime,
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

    if (!order.location?.locationSquareId) {
      throw new UnprocessableEntityException(translations.locationNoSquareId);
    }

    if (!order.squareId) {
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

    const newPickupDateTime =
      pickupDateTime ?? addMinutes(new Date(), 15).toISOString();

    this.utils.validatePickupTimeOrThrow({
      pickupAt: newPickupDateTime,
      businessHours: order.location?.businessHours ?? [],
    });

    const squareUpdateOrderResponse: ApiResponse<UpdateOrderResponse> =
      await this.squareService.updateOrderOrThrow({
        accessToken: merchant.squareAccessToken,
        orderId: order.squareId,
        body: {
          order: {
            locationId: order.location.locationSquareId,
            version: order.squareVersion,
            state: 'OPEN',
            fulfillments: [
              {
                type: 'PICKUP',
                pickupDetails: {
                  note,
                  scheduleType: pickupDateTime ? 'SCHEDULED' : 'ASAP',
                  pickupAt: pickupDateTime ? pickupDateTime : newPickupDateTime,
                  recipient: {
                    customerId: customer.squareId,
                    displayName: recipientDisplayName ?? user?.fullName,
                    phoneNumber: recipient?.phoneNumber ?? user?.phoneNumber,
                  },
                },
              },
            ],
          },
        },
      });

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

    await this.squareService.createPaymentOrThrow({
      accessToken: merchant.squareAccessToken,
      body: {
        sourceId: paymentSquareId,
        idempotencyKey: idempotencyKey,
        customerId: customer.squareId,
        locationId: order.location.locationSquareId,
        amountMoney: orderTotalMoney,
        tipMoney: {
          amount: BigInt(Math.floor(orderTipMoney ?? 0)),
          currency: orderTotalMoney.currency,
        },
        orderId: squareOrderFromUpdate.id,
        referenceId: order.id,
      },
    });

    updatedOrder.closedAt = new Date();
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
