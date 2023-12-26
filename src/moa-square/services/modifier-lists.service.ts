import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogObject } from 'square';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { type WrapperType } from '../../utils/wrapper-type.js';
import { MoaSelectionType } from '../dto/catalogs/catalogs.types.js';
import { ModifierListEntity } from '../entities/modifier-list.entity.js';
import { ModifierLocationOverridesService } from './modifier-location-overrides.service.js';
import { ModifiersService } from './modifiers.service.js';

@Injectable()
export class ModifierListsService extends EntityRepositoryService<ModifierListEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(ModifierListEntity)
    protected readonly repository: Repository<ModifierListEntity>,
    protected readonly modifierLocationOverridesService: ModifierLocationOverridesService,
    @Inject(forwardRef(() => ModifiersService))
    protected readonly modifiersService: WrapperType<ModifiersService>,
  ) {
    const logger = new Logger(ModifierListsService.name);
    super(repository, logger);
    this.logger = logger;
  }

  /*
{
      "type": "MODIFIER_LIST",
      "id": "4DROX2O3EJQOT4FJYIPU2KWJ",
      "updated_at": "2023-10-17T01:54:48.474Z",
      "created_at": "2023-10-17T01:54:48.474Z",
      "version": 1697507688474,
      "is_deleted": false,
      "present_at_all_locations": true,
      "modifier_list_data": {
        "name": "Material",
        "ordinal": 99999999,
        "selection_type": "SINGLE",
        "modifiers": [
          {
            "type": "MODIFIER",
            "id": "KTNXWECU3H6GXO6QMTVI2M63",
            "updated_at": "2023-10-17T01:54:48.474Z",
            "created_at": "2023-10-17T01:54:48.474Z",
            "version": 1697507688474,
            "is_deleted": false,
            "present_at_all_locations": true,
            "modifier_data": {
              "name": "Plastic",
              "ordinal": 1,
              "modifier_list_id": "4DROX2O3EJQOT4FJYIPU2KWJ"
            }
          },
        ]
      }
    },
  */
  async process(params: {
    catalogObject: CatalogObject;
    catalogId: string;
    merchantId: string;
  }) {
    this.logger.verbose(this.process.name);
    const { catalogObject, catalogId, merchantId } = params;
    const squareModifierList = params.catalogObject.modifierListData;

    this.logger.debug(
      `Processing modifier list ${squareModifierList?.name} ${params.catalogObject.id}.`,
    );

    let moaModifierList = await this.findOne({
      where: {
        squareId: catalogObject.id,
        catalogId,
      },
      relations: ['modifiers'],
    });

    if (moaModifierList == null) {
      moaModifierList = await this.save(
        this.create({
          squareId: params.catalogObject.id,
          name: squareModifierList?.name,
          ordinal: squareModifierList?.ordinal,
          selectionType: (squareModifierList?.selectionType ??
            'SINGLE') as MoaSelectionType,
          catalogId,
        }),
      );
      moaModifierList.modifiers = [];
      this.logger.debug(
        `Created modifier list ${moaModifierList.name} ${moaModifierList.id}.`,
      );
    } else {
      moaModifierList.name = squareModifierList?.name;
      moaModifierList.ordinal = squareModifierList?.ordinal;
      moaModifierList.selectionType = (squareModifierList?.selectionType ??
        'SINGLE') as MoaSelectionType;
      moaModifierList = await this.save(moaModifierList);
    }

    for (const modifier of squareModifierList?.modifiers ?? []) {
      await this.modifiersService.process({
        squareCatalogObject: modifier,
        catalogId,
        merchantId,
      });
    }

    this.logger.verbose(`Updated modifier list ${moaModifierList.name}.`);
    return moaModifierList;
  }
}
