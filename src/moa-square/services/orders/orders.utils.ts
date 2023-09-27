import {
  BadRequestException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  addDays,
  addHours,
  addMinutes,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
} from 'date-fns';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { OrderLineItem, Order as SquareOrder } from 'square';
import { In } from 'typeorm';
import { I18nTranslations } from '../../../i18n/i18n.generated.js';
import { OrdersVariationLineItemInput } from '../../dto/orders/variation-add.dto.js';
import { BusinessHoursPeriodEntity } from '../../entities/locations/business-hours-period.entity.js';
import { OrderEntity } from '../../entities/orders/order.entity.js';
import { ModifiersService } from '../catalogs/modifiers.service.js';
import { VariationsService } from '../catalogs/variations.service.js';
import { LineItemService } from './line-item.service.js';

@Injectable()
export class OrdersUtils {
  private readonly logger = new Logger(OrdersUtils.name);

  constructor(
    protected readonly i18n: I18nService<I18nTranslations>,
    private readonly lineItemsService: LineItemService,
    private readonly variationsService: VariationsService,
    private readonly modifiersService: ModifiersService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  currentLanguageTranslations() {
    return this.i18n.t('orders', {
      lang: I18nContext.current()?.lang,
    });
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
    this.logger.debug(
      `removing ${existingMoaLineItems.length} line items from ${order.id}`,
    );
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

  validatePickupTimeOrThrow(params: {
    businessHours: BusinessHoursPeriodEntity[];
    pickupAt?: string;
  }) {
    const { businessHours, pickupAt } = params;
    this.logger.verbose(this.validatePickupTimeOrThrow.name);
    const translations = this.currentLanguageTranslations();

    const pickupDateTime = pickupAt
      ? new Date(pickupAt)
      : addMinutes(new Date(), 15);
    const now = new Date();

    if (isBefore(pickupDateTime, now)) {
      throw new BadRequestException(translations.pickupInPast);
    }

    if (isAfter(pickupDateTime, addDays(now, 7))) {
      throw new BadRequestException(translations.pickupTooFarInFuture);
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
      throw new BadRequestException(translations.pickupOutsideBusinessHours);
    }
  }

  isWithinHour(date: Date) {
    return isWithinInterval(date, {
      start: new Date(),
      end: addHours(new Date(), 1),
    });
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
