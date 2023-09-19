import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogObject } from 'square';
import { Repository } from 'typeorm';
import { ModifierList } from '../../catalogs/entities/modifier-list.entity.js';
import { AppLogger } from '../../logger/app.logger.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';
import { MoaSelectionType } from '../dto/catalogs.types.js';
import { ModifierLocationOverridesService } from './modifier-location-overrides.service.js';

@Injectable()
export class ModifierListsService extends EntityRepositoryService<ModifierList> {
  constructor(
    @InjectRepository(ModifierList)
    protected readonly repository: Repository<ModifierList>,
    protected readonly modifierLocationOverridesService: ModifierLocationOverridesService,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(ModifierListsService.name);
    super(repository, logger);
  }

  async process(params: {
    catalogObject: CatalogObject;
    moaCatalogId: string;
  }) {
    const squareModifierList = params.catalogObject.modifierListData;
    const moaCatalogId = params.moaCatalogId;

    this.logger.debug(
      `Processing modifier list ${squareModifierList?.name} ${params.catalogObject.id}.`,
    );

    let moaModifierList = await this.findOne({
      where: {
        squareId: params.catalogObject.id,
        catalogId: moaCatalogId,
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
          catalogId: moaCatalogId,
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

    return moaModifierList;
  }
}
