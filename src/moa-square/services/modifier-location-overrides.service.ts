import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ModifierLocationOverrides } from 'square';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { LocationEntity } from '../entities/location.entity.js';
import { ModifierLocationOverrideEntity } from '../entities/modifier-location-override.entity.js';

@Injectable()
export class ModifierLocationOverridesService extends EntityRepositoryService<ModifierLocationOverrideEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(ModifierLocationOverrideEntity)
    protected readonly repository: Repository<ModifierLocationOverrideEntity>,
  ) {
    const logger = new Logger(ModifierLocationOverridesService.name);
    super(repository, logger);
    this.logger = logger;
  }

  async process(params: {
    forModifierWithId: string;
    squareModifierLocationOverrides: ModifierLocationOverrides[];
    moaLocations: LocationEntity[];
    moaCatalogId: string;
  }) {
    this.logger.verbose(this.process.name);
    const {
      squareModifierLocationOverrides,
      forModifierWithId: moaModifierId,
      moaLocations,
    } = params;
    // First, delete all existing ModifierLocationOverrides for this moaModifier
    const existingModifierLocationOverrides = await this.find({
      where: {
        modifierId: moaModifierId,
      },
    });
    for (const existingOverride of existingModifierLocationOverrides) {
      await this.remove(existingOverride);
    }

    // Then, recreate them based on the current Square data
    for (const modifierOverride of squareModifierLocationOverrides) {
      const moaLocationForModifierOverride = moaLocations.find((value) => {
        return value.squareId === modifierOverride.locationId;
      });

      const moaModifierLocationOverride = new ModifierLocationOverrideEntity();
      moaModifierLocationOverride.modifierId = moaModifierId;
      moaModifierLocationOverride.locationId =
        moaLocationForModifierOverride?.id;
      moaModifierLocationOverride.amount = Number(
        modifierOverride.priceMoney?.amount ?? 0,
      );
      moaModifierLocationOverride.catalogId = params.moaCatalogId;

      await this.save(moaModifierLocationOverride);
    }
  }
}
