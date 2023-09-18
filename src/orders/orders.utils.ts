import { BadRequestException, Logger } from '@nestjs/common';
import {
  addDays,
  addHours,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
} from 'date-fns';
import { Order as SquareOrder } from 'square';
import { BusinessHoursPeriod } from '../locations/entities/business-hours-period.entity.js';
import { Order } from './entities/order.entity.js';
import { LineItemService } from './services/line-item.service.js';

export class OrdersUtils {
  private readonly logger = new Logger(OrdersUtils.name);

  constructor(private lineItemsService: LineItemService) {}

  async updateAndSaveOrderForSquareOrder(params: {
    order: Order;
    squareOrder: SquareOrder;
  }): Promise<Order> {
    const { order, squareOrder } = params;
    this.logger.debug(
      `updating ${order.id} for square order ${squareOrder?.id}}`,
    );
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

    return this.updateAndSaveOrderForSquareOrderLineItems(params);
  }

  async updateAndSaveOrderForSquareOrderLineItems(params: {
    order: Order;
    squareOrder: SquareOrder;
  }) {
    const { order, squareOrder } = params;
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
}
