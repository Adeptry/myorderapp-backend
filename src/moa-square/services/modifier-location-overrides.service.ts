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
    for (const override of squareModifierLocationOverrides) {
      const moaLocationForModifierOverride = moaLocations.find((value) => {
        return value.squareId === override.locationId;
      });

      const moaModifierLocationOverride = new ModifierLocationOverrideEntity();
      moaModifierLocationOverride.modifierId = moaModifierId;
      moaModifierLocationOverride.locationId =
        moaLocationForModifierOverride?.id;
      moaModifierLocationOverride.priceMoneyAmount = override.priceMoney?.amount
        ? Number(override.priceMoney?.amount)
        : undefined;
      moaModifierLocationOverride.catalogId = params.moaCatalogId;

      await this.save(moaModifierLocationOverride);
    }
  }
}
