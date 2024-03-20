/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderLineItemModifier } from 'square';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { LineItemModifierEntity } from '../entities/line-item-modifier.entity.js';

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
