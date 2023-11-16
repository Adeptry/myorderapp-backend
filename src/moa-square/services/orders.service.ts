import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
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
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { I18nTranslations } from '../../i18n/i18n.generated.js';
import { MailService } from '../../mail/mail.service.js';
import { MessagesService } from '../../messages/messages.service.js';
import { PushService } from '../../push/push.service.js';
import { OrdersStatisticsResponse } from '../dto/orders/orders-statistics-reponse.dto.js';
import { OrdersPostPaymentBody } from '../dto/orders/payment-create.dto.js';
import { OrdersVariationLineItemInput } from '../dto/orders/variation-add.dto.js';
import {
  FulfillmentStatusEnum,
  SquareOrderFulfillmentUpdatedPayload,
  isValidFulfillmentStatus,
} from '../dto/square/square-order-fulfillment-updated.payload.js';
import { CustomerEntity } from '../entities/customer.entity.js';
import { MerchantEntity } from '../entities/merchant.entity.js';
import { OrderEntity } from '../entities/order.entity.js';
import { MyOrderAppSquareConfig } from '../moa-square.config.js';
import { CustomersService } from './customers.service.js';
import { LineItemService } from './line-item.service.js';
import { LocationsService } from './locations.service.js';
import { MerchantsService } from './merchants.service.js';
import { ModifiersService } from './modifiers.service.js';
import { VariationsService } from './variations.service.js';

@Injectable()
export class OrdersService extends EntityRepositoryService<OrderEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(OrderEntity)
    protected readonly repository: Repository<OrderEntity>,
    @Inject(MyOrderAppSquareConfig.KEY)
    private readonly config: ConfigType<typeof MyOrderAppSquareConfig>,
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly lineItemsService: LineItemService,
    private readonly squareService: NestSquareService,
    private readonly locationsService: LocationsService,
    private readonly merchantsService: MerchantsService,
    private readonly customersService: CustomersService,
    private readonly variationsService: VariationsService,
    private readonly modifiersService: ModifiersService,
    private readonly messagesService: MessagesService,
    private readonly mailService: MailService,
    private readonly pushService: PushService,
  ) {
    const logger = new Logger(OrdersService.name);
    super(repository, logger);
    this.logger = logger;
  }

  private translations() {
    return this.i18n.t('moaSquare', {
      lang: I18nContext.current()?.lang,
    });
  }

  async statistics(
    where?: FindOptionsWhere<OrderEntity> | FindOptionsWhere<OrderEntity>[],
  ): Promise<OrdersStatisticsResponse> {
    return {
      count: (await this.repository.count({ where })) ?? 0,
      moneyAmount: {
        sum: (await this.repository.sum('totalMoneyAmount', where)) ?? 0,
        average:
          (await this.repository.average('totalMoneyAmount', where)) ?? 0,
        minimum:
          (await this.repository.minimum('totalMoneyAmount', where)) ?? 0,
        maximum:
          (await this.repository.maximum('totalMoneyAmount', where)) ?? 0,
      },
      tipMoneyAmount: {
        sum: (await this.repository.sum('totalTipMoneyAmount', where)) ?? 0,
        average:
          (await this.repository.average('totalTipMoneyAmount', where)) ?? 0,
        minimum:
          (await this.repository.minimum('totalTipMoneyAmount', where)) ?? 0,
        maximum:
          (await this.repository.maximum('totalTipMoneyAmount', where)) ?? 0,
      },
      appFeeMoneyAmount: {
        sum: (await this.repository.sum('appFeeMoneyAmount', where)) ?? 0,
        average:
          (await this.repository.average('appFeeMoneyAmount', where)) ?? 0,
        minimum:
          (await this.repository.minimum('appFeeMoneyAmount', where)) ?? 0,
        maximum:
          (await this.repository.maximum('appFeeMoneyAmount', where)) ?? 0,
      },
      serviceChargeMoneyAmount: {
        sum:
          (await this.repository.sum('totalServiceChargeMoneyAmount', where)) ??
          0,
        average:
          (await this.repository.average(
            'totalServiceChargeMoneyAmount',
            where,
          )) ?? 0,
        minimum:
          (await this.repository.minimum(
            'totalServiceChargeMoneyAmount',
            where,
          )) ?? 0,
        maximum:
          (await this.repository.maximum(
            'totalServiceChargeMoneyAmount',
            where,
          )) ?? 0,
      },
      taxMoneyAmount: {
        sum: (await this.repository.sum('totalTaxMoneyAmount', where)) ?? 0,
        average:
          (await this.repository.average('totalTaxMoneyAmount', where)) ?? 0,
        minimum:
          (await this.repository.minimum('totalTaxMoneyAmount', where)) ?? 0,
        maximum:
          (await this.repository.maximum('totalTaxMoneyAmount', where)) ?? 0,
      },
    };
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
    const translations = this.translations();
    if (!merchant.squareAccessToken) {
      throw new UnprocessableEntityException(
        translations.merchantsSquareIdNotFound,
      );
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
            translations.locationsSquareIdNotFound,
          );
        }
        const moaMainLocation = await this.locationsService.findOne({
          where: {
            squareId: locationSquareId,
            merchantId: merchant.id,
          },
        });
        if (!moaMainLocation) {
          throw new UnprocessableEntityException(
            translations.locationsMainNotFound,
          );
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
      throw new NotFoundException(translations.locationsNotFound);
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
              pricingOptions: {
                autoApplyTaxes: true,
              },
              referenceId: moaOrder.id,
              customerId: customer.squareId,
              locationId: location?.squareId ?? 'main',
              lineItems: squareOrderLineItems,
            },
          }),
      );

      const squareOrder = response.result.order;
      if (!squareOrder) {
        throw new InternalServerErrorException(
          translations.squareInvalidResponse,
        );
      }

      if (!location?.squareId) {
        location = await this.locationsService.findOneOrFail({
          where: { squareId: squareOrder.locationId },
          relations: {
            address: true,
            businessHours: true,
          },
        });
        if (!location.id) {
          throw new UnprocessableEntityException(
            translations.locationsNotFound,
          );
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
    const translations = this.translations();

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
        translations.merchantsSquareAccessTokenNotFound,
      );
    }
    const orderSquareId = order.squareId;
    if (!orderSquareId) {
      throw new UnprocessableEntityException(translations.ordersNotFound);
    }
    const location = await this.locationsService.findOneOrFail({
      where: { id: locationMoaId, merchantId: params.merchant.id },
    });
    const locationSquareId = location.squareId;
    if (!locationSquareId) {
      throw new UnprocessableEntityException(
        translations.locationsSquareIdNotFound,
      );
    }

    if (!location.id) {
      throw new NotFoundException(translations.locationsNotFound);
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
            pricingOptions: {
              autoApplyTaxes: true,
            },
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
        translations.squareInvalidResponse,
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
    const translations = this.translations();

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

    const locationSquareId = order.location?.squareId;

    const orderSquareId = order.squareId;
    if (!orderSquareId) {
      throw new UnprocessableEntityException(translations.ordersNotFound);
    }
    if (!locationSquareId) {
      throw new UnprocessableEntityException(
        translations.locationsSquareIdNotFound,
      );
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
          translations.squareInvalidResponse,
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
    const translations = this.translations();

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
      throw new UnprocessableEntityException(translations.ordersNotFound);
    }
    const location = await this.locationsService.findOne({
      where: { id: order.locationId },
    });
    const locationSquareId = location?.squareId;
    if (!locationSquareId) {
      throw new UnprocessableEntityException(
        translations.locationsSquareIdNotFound,
      );
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
        translations.squareInvalidResponse,
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
      tipMoneyAmount,
      recipient,
    } = input;

    this.logger.verbose(this.createPaymentOrThrow.name);
    const translations = this.translations();

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
      relations: {
        appConfig: true,
      },
    });

    const customer = await this.customersService.findOneOrFail({
      where: { id: customerId },
    });

    /* Order */

    const { squareId: orderSquareId, location } = order;
    if (!orderSquareId) {
      throw new UnprocessableEntityException(translations.ordersNotFound);
    }
    if (!location) {
      throw new UnprocessableEntityException(translations.locationsNotFound);
    }
    const {
      squareId: locationSquareId,
      id: locationMoaId,
      moaEnabled: locationMoaEnabled,
    } = location;
    if (!locationSquareId || !locationMoaId) {
      throw new UnprocessableEntityException(
        translations.locationsSquareIdNotFound,
      );
    }
    if (!locationMoaEnabled) {
      throw new UnprocessableEntityException(translations.locationsNotEnabled);
    }

    /* Merchant */

    const {
      tier: merchantTier,
      pickupLeadDurationMinutes,
      squareAccessToken: merchantSquareAccessToken,
      appConfig,
    } = merchant;
    if (
      !merchantSquareAccessToken ||
      merchantTier == undefined ||
      merchantTier > 2 ||
      merchantTier < 0 ||
      !appConfig
    ) {
      throw new UnprocessableEntityException(
        translations.merchantsSquareAccessTokenNotFound,
      );
    }

    const { enabled: merchantAppEnabled } = appConfig;

    if (!merchantAppEnabled) {
      throw new UnprocessableEntityException(translations.merchantsNotEnabled);
    }

    /* Customer */

    const {
      squareId: customerSquareId,
      id: customerMoaId,
      userId: customerUserId,
    } = customer;
    if (!customerSquareId || !customerMoaId || !customerUserId) {
      throw new UnprocessableEntityException(
        translations.customersSquareIdNotFound,
      );
    }

    if (recipient) {
      await this.customersService.patchAndSyncSquare({
        id: customerUserId,
        merchantId: merchantId,
        body: recipient,
      });
    }

    const pickupOrAsapDate = pickupDateString
      ? new Date(pickupDateString)
      : await this.locationsService.firstPickupDateAtLocationWithinDuration({
          locationId: locationMoaId,
          durationMinutes: pickupLeadDurationMinutes ?? 10,
        });

    await this.locationsService.validatePickupDateTimeOrThrow({
      pickupDate: pickupOrAsapDate,
      id: locationMoaId,
    });

    const squareRetrieveOrderResponse = await this.squareService.retryOrThrow(
      merchantSquareAccessToken,
      (client) => client.ordersApi.retrieveOrder(orderSquareId),
    );

    const squareRetrievedOrder = squareRetrieveOrderResponse.result.order;
    const squareRetrievedOrderLineItems = squareRetrievedOrder?.lineItems?.map(
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

    try {
      const squareUpdateBody: UpdateOrderRequest = {
        order: {
          locationId: locationSquareId,
          version: order.squareVersion,
          state: 'CANCELED',
        },
      };
      await this.squareService.retryOrThrow(
        merchantSquareAccessToken,
        (client) =>
          client.ordersApi.updateOrder(orderSquareId, {
            ...squareUpdateBody,
            idempotencyKey,
          }),
      );
      this.logger.log(`Canceled order ${orderSquareId}`);
    } catch (error) {
      this.logger.error(error);
    }

    const squareCreateOrderResponse: ApiResponse<UpdateOrderResponse> =
      await this.squareService.retryOrThrow(
        merchantSquareAccessToken,
        (client) =>
          client.ordersApi.createOrder({
            order: {
              locationId: locationSquareId,
              state: 'OPEN',
              lineItems: squareRetrievedOrderLineItems,
              pricingOptions: {
                autoApplyTaxes: true,
              },
              referenceId: order.id,
              fulfillments: [
                {
                  type: 'PICKUP',
                  pickupDetails: {
                    note,
                    scheduleType: pickupDateString ? 'SCHEDULED' : 'ASAP',
                    pickupAt: pickupOrAsapDate.toISOString(),
                    recipient: {
                      customerId: customerSquareId,
                    },
                  },
                },
              ],
            },
          }),
      );

    const squareCreateOrderResult = squareCreateOrderResponse.result.order;
    if (!squareCreateOrderResult) {
      throw new InternalServerErrorException(
        translations.squareInvalidResponse,
      );
    }
    const { totalMoney: orderTotalMoney, totalTaxMoney: orderTotalTaxMoney } =
      squareCreateOrderResult;
    if (!orderTotalMoney || !orderTotalTaxMoney) {
      throw new UnprocessableEntityException(
        translations.squareInvalidResponse,
      );
    }
    const { amount: orderTotalMoneyAmount, currency } = orderTotalMoney;
    if (!orderTotalMoneyAmount || !currency) {
      throw new UnprocessableEntityException(
        translations.squareInvalidResponse,
      );
    }

    const updatedOrder = await this.saveFromSquareOrder({
      order,
      squareOrder: squareCreateOrderResult,
    });

    const appFeeMoneyAmount = this.calculateAppFee({
      orderSubtotalMoneyAmount: BigInt(order.subtotalMoneyAmount),
      merchantTier,
    });

    const squarePaymentResponse = await this.squareService.retryOrThrow(
      merchantSquareAccessToken,
      (client) =>
        client.paymentsApi.createPayment({
          sourceId: paymentSquareId,
          idempotencyKey: idempotencyKey,
          customerId: customerSquareId,
          locationId: locationSquareId,
          amountMoney: orderTotalMoney,
          tipMoney: {
            amount: BigInt(Math.floor(tipMoneyAmount ?? 0)),
            currency,
          },
          appFeeMoney: {
            amount: appFeeMoneyAmount,
            currency,
          },
          orderId: squareCreateOrderResult.id,
          referenceId: order.id,
        }),
    );
    const squarePayment = squarePaymentResponse.result.payment;

    updatedOrder.squareId = squareCreateOrderResult.id;
    updatedOrder.closedDate = new Date();
    updatedOrder.squareFulfillmentStatus = FulfillmentStatusEnum.proposed;
    updatedOrder.pickupDate = new Date(pickupOrAsapDate);
    updatedOrder.customerId = customerMoaId;
    updatedOrder.totalMoneyAmount = Number(
      squarePayment?.totalMoney?.amount ?? 0,
    );
    updatedOrder.totalTipMoneyAmount = Number(
      squarePayment?.tipMoney?.amount ?? 0,
    );
    updatedOrder.appFeeMoneyAmount = Number(
      squarePayment?.appFeeMoney?.amount ?? 0,
    );
    updatedOrder.note = note;

    customer.currentOrder = null;
    await customer.save();

    return this.save(updatedOrder);
  }

  private calculateAppFee(params: {
    orderSubtotalMoneyAmount: bigint;
    merchantTier: number;
  }): bigint {
    const { orderSubtotalMoneyAmount, merchantTier } = params;

    this.logger.verbose(this.calculateAppFee.name);
    const translations = this.translations();

    let appFeeBigIntNumerator: bigint;

    switch (merchantTier) {
      case 0:
        appFeeBigIntNumerator = this.config.squareTier0AppFeeBigIntNumerator;
        break;
      case 1:
        appFeeBigIntNumerator = this.config.squareTier1AppFeeBigIntNumerator;
        break;
      case 2:
        appFeeBigIntNumerator = this.config.squareTier2AppFeeBigIntNumerator;
        break;
      default:
        throw new UnprocessableEntityException(
          translations.merchantsTierNotFound,
        );
    }

    if (this.config.squareAppFeeBigIntDenominator === BigInt(0)) {
      throw new Error('Denominator cannot be zero');
    }

    this.logger.debug(
      `(${orderSubtotalMoneyAmount} * ${appFeeBigIntNumerator}) / ${this.config.squareAppFeeBigIntDenominator}`,
    );

    return (
      (orderSubtotalMoneyAmount * appFeeBigIntNumerator) /
      this.config.squareAppFeeBigIntDenominator
    );
  }

  @OnEvent('square.order.fulfillment.updated')
  protected async handleSquareOrderFulfillmentUpdate(
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

    const order = await this.findOne({
      where: { squareId: squareOrderId },
    });
    if (!order?.id) {
      this.logger.error(`Order with id ${squareOrderId} not found`);
      return; // Exit if order not found
    }
    const { id: orderId } = order;

    const orderFulfillment = payload?.data?.object?.order_fulfillment_updated;
    const lastFulfillmentUpdate = (
      orderFulfillment?.fulfillment_update ?? []
    ).pop();

    if (lastFulfillmentUpdate) {
      const newFulfillmentStatus = lastFulfillmentUpdate.new_state;
      const oldFulfillmentStatus = order.squareFulfillmentStatus;
      if (
        newFulfillmentStatus &&
        isValidFulfillmentStatus(newFulfillmentStatus) &&
        newFulfillmentStatus != oldFulfillmentStatus &&
        newFulfillmentStatus != FulfillmentStatusEnum.proposed
      ) {
        order.squareFulfillmentStatus = newFulfillmentStatus;
        await this.save(order);
        try {
          await this.sendFullfillmentUpdateOrThrow({ orderId });
        } catch (error) {
          this.logger.error(error);
        }
      }
    }
  }

  private async sendFullfillmentUpdateOrThrow(params: { orderId: string }) {
    const { orderId } = params;

    this.logger.verbose(this.sendFullfillmentUpdateOrThrow.name);

    const order = await this.findOne({
      where: { id: orderId },
      relations: {
        customer: {
          user: true,
          appInstalls: true,
        },
        merchant: true,
      },
    });

    switch (order?.squareFulfillmentStatus) {
      case FulfillmentStatusEnum.proposed:
        try {
          await this.messagesService.sendOnEventSquareFulfillmentUpdateProposedOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        try {
          await this.mailService.sendOnEventSquareFulfillmentUpdateProposedOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        try {
          await this.pushService.sendOnEventSquareFulfillmentUpdateProposedOrThrow(
            { order },
          );
        } catch (error) {
          this.logger.error(error);
        }
        break;
      case FulfillmentStatusEnum.reserved:
        try {
          await this.messagesService.sendOnEventSquareFulfillmentUpdateReservedOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        try {
          await this.mailService.sendOnEventSquareFulfillmentUpdateReservedOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        try {
          await this.pushService.sendOnEventSquareFulfillmentUpdateReservedOrThrow(
            { order },
          );
        } catch (error) {
          this.logger.error(error);
        }
        break;
      case FulfillmentStatusEnum.prepared:
        try {
          await this.messagesService.sendOnEventSquareFulfillmentUpdatePreparedOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        try {
          await this.mailService.sendOnEventSquareFulfillmentUpdatePreparedOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        try {
          await this.pushService.sendOnEventSquareFulfillmentUpdatePreparedOrThrow(
            { order },
          );
        } catch (error) {
          this.logger.error(error);
        }
        break;
      case FulfillmentStatusEnum.completed:
        try {
          await this.messagesService.sendOnEventSquareFulfillmentUpdateCompletedOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        try {
          await this.mailService.sendOnEventSquareFulfillmentUpdateCompletedOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        try {
          await this.pushService.sendOnEventSquareFulfillmentUpdateCompletedOrThrow(
            { order },
          );
        } catch (error) {
          this.logger.error(error);
        }
        break;
      case FulfillmentStatusEnum.canceled:
        try {
          await this.messagesService.sendOnEventSquareFulfillmentUpdateCanceledOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        try {
          await this.mailService.sendOnEventSquareFulfillmentUpdateCanceledOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        try {
          await this.pushService.sendOnEventSquareFulfillmentUpdateCanceledOrThrow(
            { order },
          );
        } catch (error) {
          this.logger.error(error);
        }
        break;
      case FulfillmentStatusEnum.failed:
        try {
          await this.messagesService.sendOnEventSquareFulfillmentUpdateFailedOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        try {
          await this.mailService.sendOnEventSquareFulfillmentUpdateFailedOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        try {
          await this.pushService.sendOnEventSquareFulfillmentUpdateFailedOrThrow(
            {
              order,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
        break;
    }
  }

  private async saveFromSquareOrder(params: {
    order: OrderEntity;
    squareOrder: SquareOrder;
  }): Promise<OrderEntity> {
    const { order, squareOrder } = params;
    this.logger.verbose(this.saveFromSquareOrder.name);

    order.squareId = squareOrder?.id;
    order.squareVersion =
      squareOrder?.version ?? (order.squareVersion ?? 0) + 1;

    order.totalMoneyAmount = Number(squareOrder?.totalMoney?.amount);
    order.totalTaxMoneyAmount = Number(squareOrder?.totalTaxMoney?.amount);
    order.totalDiscountMoneyAmount = Number(
      squareOrder?.totalDiscountMoney?.amount,
    );
    order.totalTipMoneyAmount = Number(squareOrder?.totalTipMoney?.amount);
    order.totalServiceChargeMoneyAmount = Number(
      squareOrder?.totalServiceChargeMoney?.amount,
    );

    return this.saveFromSquareLineItems(params);
  }

  private async saveFromSquareLineItems(params: {
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

  private async squareOrderLineItemsFor(params: {
    variations: OrdersVariationLineItemInput[];
  }) {
    this.logger.verbose(this.squareOrderLineItemsFor.name);
    const translations = this.translations();

    const orderLineItems: OrderLineItem[] = [];
    for (const dto of params.variations) {
      const variation = await this.variationsService.findOne({
        where: { id: dto.id },
      });
      if (!variation?.squareId) {
        throw new UnprocessableEntityException(translations.squareIdNotFound);
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
          throw new UnprocessableEntityException(translations.squareIdNotFound);
        }

        for (const modifier of modifiers) {
          if (!modifier.squareId) {
            throw new UnprocessableEntityException(
              translations.squareIdNotFound,
            );
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
