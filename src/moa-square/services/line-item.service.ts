import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderLineItem } from 'square';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';
import { LineItemEntity } from '../entities/orders/line-item.entity.js';
import { LineItemModifierService } from './line-item-modifier.service.js';

@Injectable()
export class LineItemService extends EntityRepositoryService<LineItemEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(LineItemEntity)
    protected readonly repository: Repository<LineItemEntity>,
    protected readonly lineItemModifierService: LineItemModifierService,
  ) {
    const logger = new Logger(LineItemService.name);
    super(repository, logger);
    this.logger = logger;
  }

  fromSquareLineItem(params: { squareLineItem: OrderLineItem }) {
    const { squareLineItem } = params;
    this.logger.debug(
      `building line item from square line item ${squareLineItem.uid}`,
    );
    const lineItem = new LineItemEntity();
    lineItem.squareUid = squareLineItem.uid ?? undefined;
    lineItem.name = squareLineItem.name ?? undefined;
    lineItem.quantity = squareLineItem.quantity ?? undefined;
    lineItem.note = squareLineItem.note ?? undefined;
    // lineItem.variationId = squareLineItem.catalogObjectId ?? undefined;
    lineItem.variationName = squareLineItem.variationName ?? undefined;
    lineItem.basePriceMoneyAmount = Number(
      squareLineItem.basePriceMoney?.amount ?? 0,
    );
    lineItem.variationTotalMoneyAmount = Number(
      squareLineItem.variationTotalPriceMoney?.amount ?? 0,
    );
    lineItem.grossSalesMoneyAmount = Number(
      squareLineItem.grossSalesMoney?.amount ?? 0,
    );
    lineItem.totalTaxMoneyAmount = Number(
      squareLineItem.totalTaxMoney?.amount ?? 0,
    );
    lineItem.totalDiscountMoneyAmount = Number(
      squareLineItem.totalDiscountMoney?.amount ?? 0,
    );
    lineItem.totalMoneyAmount = Number(squareLineItem.totalMoney?.amount ?? 0);
    lineItem.totalServiceChargeMoneyAmount = Number(
      squareLineItem.totalServiceChargeMoney?.amount ?? 0,
    );

    if (squareLineItem.modifiers) {
      lineItem.modifiers = squareLineItem.modifiers.map((modifier) =>
        this.lineItemModifierService.fromSquareLineItemModifier(modifier),
      );
    }

    return lineItem;
  }
}
