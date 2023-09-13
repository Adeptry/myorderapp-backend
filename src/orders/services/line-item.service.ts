import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderLineItem } from 'square';
import { LineItem } from 'src/orders/entities/line-item.entity';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { Repository } from 'typeorm';
import { LineItemModifierService } from './line-item-modifier.service';

@Injectable()
export class LineItemService extends EntityRepositoryService<LineItem> {
  private readonly logger = new Logger(LineItemService.name);

  constructor(
    @InjectRepository(LineItem)
    protected readonly repository: Repository<LineItem>,
    protected readonly lineItemModifierService: LineItemModifierService,
  ) {
    super(repository);
  }

  fromSquareLineItem(params: { squareLineItem: OrderLineItem }) {
    const { squareLineItem } = params;
    this.logger.debug(
      `building line item from square line item ${squareLineItem.uid}`,
    );
    const lineItem = new LineItem();
    lineItem.squareUid = squareLineItem.uid ?? undefined;
    lineItem.name = squareLineItem.name ?? undefined;
    lineItem.quantity = squareLineItem.quantity ?? undefined;
    lineItem.note = squareLineItem.note ?? undefined;
    // lineItem.variationId = squareLineItem.catalogObjectId ?? undefined;
    lineItem.variationName = squareLineItem.variationName ?? undefined;
    lineItem.currency = squareLineItem.basePriceMoney?.currency ?? undefined;
    lineItem.basePriceMoney = Number(
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
