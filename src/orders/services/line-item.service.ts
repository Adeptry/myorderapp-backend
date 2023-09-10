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
    const lineItem = new LineItem();
    lineItem.squareUid = params.squareLineItem.uid ?? undefined;
    lineItem.name = params.squareLineItem.name ?? undefined;
    lineItem.quantity = params.squareLineItem.quantity ?? undefined;
    lineItem.note = params.squareLineItem.note ?? undefined;
    // lineItem.variationId = params.squareLineItem.catalogObjectId ?? undefined;
    lineItem.variationName = params.squareLineItem.variationName ?? undefined;
    lineItem.currency =
      params.squareLineItem.basePriceMoney?.currency ?? undefined;
    lineItem.basePriceMoney = Number(
      params.squareLineItem.basePriceMoney?.amount ?? 0,
    );
    lineItem.variationTotalMoneyAmount = Number(
      params.squareLineItem.variationTotalPriceMoney?.amount ?? 0,
    );
    lineItem.grossSalesMoneyAmount = Number(
      params.squareLineItem.grossSalesMoney?.amount ?? 0,
    );
    lineItem.totalTaxMoneyAmount = Number(
      params.squareLineItem.totalTaxMoney?.amount ?? 0,
    );
    lineItem.totalDiscountMoneyAmount = Number(
      params.squareLineItem.totalDiscountMoney?.amount ?? 0,
    );
    lineItem.totalMoneyAmount = Number(
      params.squareLineItem.totalMoney?.amount ?? 0,
    );
    lineItem.totalServiceChargeMoneyAmount = Number(
      params.squareLineItem.totalServiceChargeMoney?.amount ?? 0,
    );

    if (params.squareLineItem.modifiers) {
      lineItem.modifiers = params.squareLineItem.modifiers.map((modifier) =>
        this.lineItemModifierService.fromSquareLineItemModifier(modifier),
      );
    }

    return lineItem;
  }
}
