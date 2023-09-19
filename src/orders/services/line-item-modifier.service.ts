import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderLineItemModifier } from 'square';
import { Repository } from 'typeorm';
import { AppLogger } from '../../logger/app.logger.js';
import { LineItemModifier } from '../../orders/entities/line-item-modifier.entity.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';

@Injectable()
export class LineItemModifierService extends EntityRepositoryService<LineItemModifier> {
  constructor(
    @InjectRepository(LineItemModifier)
    protected readonly repository: Repository<LineItemModifier>,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(LineItemModifierService.name);
    super(repository, logger);
  }

  fromSquareLineItemModifier(
    squareLineItemModifier: OrderLineItemModifier,
  ): LineItemModifier {
    const modifier = new LineItemModifier();
    modifier.squareUid = squareLineItemModifier.uid ?? undefined;
    // modifier.modifierId = squareLineItemModifier.catalogObjectId ?? undefined;
    modifier.name = squareLineItemModifier.name ?? undefined;
    modifier.quantity = squareLineItemModifier.quantity ?? undefined;
    modifier.currency =
      squareLineItemModifier.basePriceMoney?.currency ?? undefined;
    modifier.baseMoneyAmount = Number(
      squareLineItemModifier.basePriceMoney?.amount ?? 0,
    );
    modifier.totalMoneyAmount = Number(
      squareLineItemModifier.totalPriceMoney?.amount ?? 0,
    );
    return modifier;
  }
}
