import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  addDays,
  addHours,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
} from 'date-fns';
import { OrderLineItem, Order as SquareOrder } from 'square';
import { In } from 'typeorm';
import { ModifiersService } from '../catalogs/services/modifiers.service.js';
import { VariationsService } from '../catalogs/services/variations.service.js';
import { BusinessHoursPeriod } from '../locations/entities/business-hours-period.entity.js';
import { AppLogger } from '../logger/app.logger.js';
import { VariationAddDto } from './dto/variation-add.dto.js';
import { Order } from './entities/order.entity.js';
import { LineItemService } from './services/line-item.service.js';

@Injectable()
export class OrdersUtils {
  constructor(
    private readonly lineItemsService: LineItemService,
    private readonly variationsService: VariationsService,
    private readonly modifiersService: ModifiersService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(OrdersUtils.name);
  }

  async updateForSquareOrder(params: {
    order: Order;
    squareOrder: SquareOrder;
  }): Promise<Order> {
    this.logger.verbose(this.updateForSquareOrder.name);
    const { order, squareOrder } = params;
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

    return this.updateForSquareLineItems(params);
  }

  async updateForSquareLineItems(params: {
    order: Order;
    squareOrder: SquareOrder;
  }) {
    this.logger.verbose(this.updateForSquareLineItems.name);
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
    this.logger.verbose(this.validatePickupTime.name);
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

  async squareOrderLineItemsFor(params: { variations: VariationAddDto[] }) {
    this.logger.verbose(this.squareOrderLineItemsFor.name);

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
        note: dto.note,
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
}
