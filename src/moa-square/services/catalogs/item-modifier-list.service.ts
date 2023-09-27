import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogItemModifierListInfo } from 'square';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../../utils/entity-repository-service.js';
import { ItemModifierListEntity } from '../../entities/catalogs/item-modifier-list.entity.js';
import { ModifierListsService } from './modifier-lists.service.js';

@Injectable()
export class ItemModifierListService extends EntityRepositoryService<ItemModifierListEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(ItemModifierListEntity)
    protected readonly repository: Repository<ItemModifierListEntity>,
    protected readonly modifierListService: ModifierListsService,
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

    return await this.save(
      this.create({
        itemId: moaItemId,
        modifierListId: modifierList.id,
        minSelectedModifiers: squareItemModifierListInfo?.minSelectedModifiers,
        maxSelectedModifiers: squareItemModifierListInfo?.maxSelectedModifiers,
        enabled: squareItemModifierListInfo?.enabled,
      }),
    );
  }
}
