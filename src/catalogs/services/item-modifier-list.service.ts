import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogItemModifierListInfo } from 'square';
import { ItemModifierList } from 'src/catalogs/entities/item-modifier-list.entity';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { Repository } from 'typeorm';
import { ModifierListsService } from './modifier-lists.service';

@Injectable()
export class ItemModifierListService extends EntityRepositoryService<ItemModifierList> {
  private readonly logger = new Logger(ItemModifierListService.name);

  constructor(
    @InjectRepository(ItemModifierList)
    protected readonly repository: Repository<ItemModifierList>,
    protected readonly modifierListService: ModifierListsService,
  ) {
    super(repository);
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
  async processAndSave(params: {
    squareItemModifierListInfo: CatalogItemModifierListInfo;
    moaItemId: string;
    catalogId: string;
  }) {
    const { squareItemModifierListInfo, moaItemId, catalogId } = params;

    this.logger.verbose(
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