import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ModifierLocationOverrides } from 'square';
import { ModifierLocationOverride } from 'src/catalogs/entities/modifier-location-override.entity';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { Repository } from 'typeorm';
import { Location } from '../../locations/entities/location.entity';

@Injectable()
export class ModifierLocationOverridesService extends EntityRepositoryService<ModifierLocationOverride> {
  constructor(
    @InjectRepository(ModifierLocationOverride)
    protected readonly repository: Repository<ModifierLocationOverride>,
  ) {
    super(repository);
  }

  async processAndSave(params: {
    forModifierWithId: string;
    squareModifierLocationOverrides: ModifierLocationOverrides[];
    moaLocations: Location[];
  }) {
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
