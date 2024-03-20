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
import { CatalogItemModifierListInfo } from 'square';
import { In, Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { ItemModifierListEntity } from '../entities/item-modifier-list.entity.js';
import { ModifierListsService } from './modifier-lists.service.js';
import { ModifiersService } from './modifiers.service.js';

@Injectable()
export class ItemModifierListService extends EntityRepositoryService<ItemModifierListEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(ItemModifierListEntity)
    protected readonly repository: Repository<ItemModifierListEntity>,
    protected readonly modifierListService: ModifierListsService,
    protected readonly modifiersService: ModifiersService,
  ) {
    const logger = new Logger(ItemModifierListService.name);
    super(repository, logger);
    this.logger = logger;
  }

  /*
  {
    "modifier_list_id": "KICVKBYD7NYNZZPKXNIKYWCB",
    "visibility": "PUBLIC",
    "modifier_overrides": [
      {
        "modifier_id": "CBDVUZ5PDTEVG435HLSYERTD",
        "on_by_default": true
      },
      {
        "modifier_id": "UYBL55PDHUCFII5R3P6KWDG7",
        "on_by_default": false
      },
      {
        "modifier_id": "DDXSWNLFV66FVWC4YIUTLJQI",
        "on_by_default": false
      },
      {
        "modifier_id": "LJFYACA73JYYBL4N34KEBWWU",
        "on_by_default": false
      },
      {
        "modifier_id": "FH57TXPKJOL4YARAEMQCLRVT",
        "on_by_default": false
      }
    ],
    "min_selected_modifiers": 1,
    "max_selected_modifiers": 2,
    "enabled": true
  },
  */
  async process(params: {
    squareItemModifierListInfo: CatalogItemModifierListInfo;
    moaItemId: string;
    catalogId: string;
  }) {
    this.logger.verbose(this.process.name);
    const { squareItemModifierListInfo, moaItemId, catalogId } = params;

    this.logger.debug(
      `Processing item modifier list ${squareItemModifierListInfo?.modifierListId} ${moaItemId}.`,
    );

    const modifierList = await this.modifierListService.findOne({
      where: {
        squareId: squareItemModifierListInfo?.modifierListId,
        catalogId: catalogId,
      },
    });

    if (modifierList?.id == null) {
      throw new Error(
        `Modifier list ${squareItemModifierListInfo?.modifierListId} not found.`,
      );
    }

    const onByDefaultModiferOverrides =
      squareItemModifierListInfo?.modifierOverrides?.filter(
        (value) => value.onByDefault,
      );
    const onByDefaultModifierOverrideSquareIds =
      onByDefaultModiferOverrides?.map((value) => value.modifierId) ?? [];
    const onByDefaultModifiers = await this.modifiersService.find({
      where: { squareId: In(onByDefaultModifierOverrideSquareIds) },
    });
    const onByDefaultModifierIds = onByDefaultModifiers.map(
      (value) => value.id!,
    );

    return await this.save(
      this.create({
        itemId: moaItemId,
        modifierListId: modifierList.id,
        onByDefaultModifierIds: onByDefaultModifierIds,
        minSelectedModifiers: squareItemModifierListInfo?.minSelectedModifiers,
        maxSelectedModifiers: squareItemModifierListInfo?.maxSelectedModifiers,
        enabled: squareItemModifierListInfo?.enabled,
      }),
    );
  }
}
