import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogObject } from 'square';
import { Repository } from 'typeorm';
import { ModifierList } from '../../catalogs/entities/modifier-list.entity.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';
import { MoaSelectionType } from '../dto/catalogs.types.js';
import { ModifierLocationOverridesService } from './modifier-location-overrides.service.js';

@Injectable()
export class ModifierListsService extends EntityRepositoryService<ModifierList> {
  private readonly logger = new Logger(ModifierListsService.name);

  constructor(
    @InjectRepository(ModifierList)
    protected readonly repository: Repository<ModifierList>,
    protected readonly modifierLocationOverridesService: ModifierLocationOverridesService,
  ) {
    super(repository);
  }

  async processAndSave(params: {
    catalogObject: CatalogObject;
    moaCatalogId: string;
  }) {
    const squareModifierList = params.catalogObject.modifierListData;
    const moaCatalogId = params.moaCatalogId;

    this.logger.verbose(
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
      this.logger.verbose(
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
