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
import { OrderLineItem } from 'square';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { LineItemEntity } from '../entities/line-item.entity.js';
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
