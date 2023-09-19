import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ModifierLocationOverrides } from 'square';
import { Repository } from 'typeorm';
import { ModifierLocationOverride } from '../../catalogs/entities/modifier-location-override.entity.js';
import { Location } from '../../locations/entities/location.entity.js';
import { AppLogger } from '../../logger/app.logger.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';

@Injectable()
export class ModifierLocationOverridesService extends EntityRepositoryService<ModifierLocationOverride> {
  constructor(
    @InjectRepository(ModifierLocationOverride)
    protected readonly repository: Repository<ModifierLocationOverride>,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(ModifierLocationOverridesService.name);
    super(repository, logger);
  }

  async process(params: {
    forModifierWithId: string;
    squareModifierLocationOverrides: ModifierLocationOverrides[];
    moaLocations: Location[];
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
        return value.locationSquareId === modifierOverride.locationId;
      });

      const moaModifierLocationOverride = new ModifierLocationOverride();
      moaModifierLocationOverride.modifierId = moaModifierId;
      moaModifierLocationOverride.locationId =
        moaLocationForModifierOverride?.id;
      moaModifierLocationOverride.amount = Number(
        modifierOverride.priceMoney?.amount ?? 0,
      );
      moaModifierLocationOverride.currency =
        modifierOverride.priceMoney?.currency;

      await this.save(moaModifierLocationOverride);
    }
  }
}
