import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderLineItemModifier } from 'square';
import { LineItemModifier } from 'src/orders/entities/line-item-modifier.entity';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { Repository } from 'typeorm';

@Injectable()
export class LineItemModifierService extends EntityRepositoryService<LineItemModifier> {
  private readonly logger = new Logger(LineItemModifierService.name);

  constructor(
    @InjectRepository(LineItemModifier)
    protected readonly repository: Repository<LineItemModifier>,
  ) {
    super(repository);
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
