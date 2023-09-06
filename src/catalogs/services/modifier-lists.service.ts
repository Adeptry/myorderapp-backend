import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogObject } from 'square';
import { ModifierList } from 'src/catalogs/entities/modifier-list.entity';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { Repository } from 'typeorm';
import { MoaSelectionType } from '../dto/catalogs.types';
import { ModifierLocationOverridesService } from './modifier-location-overrides.service';

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
          selectionType:
            MoaSelectionType[squareModifierList?.selectionType ?? 'SINGLE'],
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
      moaModifierList.selectionType =
        MoaSelectionType[squareModifierList?.selectionType ?? 'SINGLE'];
      moaModifierList = await this.save(moaModifierList);
    }

    return moaModifierList;
  }
}
