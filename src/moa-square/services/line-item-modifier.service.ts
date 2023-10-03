import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderLineItemModifier } from 'square';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';
import { LineItemModifierEntity } from '../entities/orders/line-item-modifier.entity.js';

@Injectable()
export class LineItemModifierService extends EntityRepositoryService<LineItemModifierEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(LineItemModifierEntity)
    protected readonly repository: Repository<LineItemModifierEntity>,
  ) {
    const logger = new Logger(LineItemModifierService.name);
    super(repository, logger);
    this.logger = logger;
  }

  fromSquareLineItemModifier(
    squareLineItemModifier: OrderLineItemModifier,
  ): LineItemModifierEntity {
    const modifier = new LineItemModifierEntity();
    modifier.squareUid = squareLineItemModifier.uid ?? undefined;
    // modifier.modifierId = squareLineItemModifier.catalogObjectId ?? undefined;
    modifier.name = squareLineItemModifier.name ?? undefined;
    modifier.quantity = squareLineItemModifier.quantity ?? undefined;
    modifier.baseMoneyAmount = Number(
      squareLineItemModifier.basePriceMoney?.amount ?? 0,
    );
    modifier.totalMoneyAmount = Number(
      squareLineItemModifier.totalPriceMoney?.amount ?? 0,
    );
    return modifier;
  }
}
