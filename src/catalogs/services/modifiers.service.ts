import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogObject } from 'square';
import { Repository } from 'typeorm';
import { Modifier } from '../../catalogs/entities/modifier.entity.js';
import { Location } from '../../locations/entities/location.entity.js';
import { AppLogger } from '../../logger/app.logger.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';
import { ModifierListsService } from './modifier-lists.service.js';
import { ModifierLocationOverridesService } from './modifier-location-overrides.service.js';

@Injectable()
export class ModifiersService extends EntityRepositoryService<Modifier> {
  constructor(
    @InjectRepository(Modifier)
    protected readonly repository: Repository<Modifier>,
    protected readonly modifierListsService: ModifierListsService,
    protected readonly modifierLocationOverridesService: ModifierLocationOverridesService,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(ModifiersService.name);
    super(repository, logger);
  }

  /*
    {
      "type": "MODIFIER",
      "id": "WEILXWIDK5BMMS2QKZ2SV3UM",
      "present_at_all_locations": true,
      "modifier_data": {
        "name": "Sugar",
        "on_by_default": false,
        "ordinal": 2,
        "modifier_list_id": "SBUBBQ46KNXQH2W64RIGWHKM",
        "location_overrides": [
          {
            "location_id": "L3XVVEYYRJN4F",
            "price_money": {
              "amount": 100,
              "currency": "USD"
            }
          }
        ]
      }
    },
  */
  async process(params: {
    squareCatalogObject: CatalogObject;
    moaCatalogId: string;
    moaLocations: Location[];
  }) {
    this.logger.verbose(this.process.name);
    const { squareCatalogObject, moaCatalogId, moaLocations } = params;
    const squareModifierData = squareCatalogObject.modifierData;

    if (squareModifierData?.modifierListId == null) {
      throw new Error(
        `Modifier ${squareCatalogObject.id} has no modifier list.`,
      );
    }

    this.logger.debug(
      `Processing modifier ${squareModifierData?.name} ${squareCatalogObject.id}.`,
    );

    let moaModifier = await this.findOne({
      where: {
        squareId: squareCatalogObject.id,
        catalogId: moaCatalogId,
      },
    });

    if (moaModifier == null) {
      moaModifier = this.create({
        squareId: squareCatalogObject.id,
        catalogId: moaCatalogId,
      });
      this.logger.debug(
        `Created modifier ${moaModifier.name} ${moaModifier.id}.`,
      );
    }

    moaModifier.name = squareModifierData?.name;
    moaModifier.ordinal = squareModifierData?.ordinal;
    moaModifier.priceAmount = Number(
      squareModifierData?.priceMoney?.amount ?? 0,
    );
    moaModifier.priceCurrency = squareModifierData?.priceMoney?.currency;

    const modifierLists = await this.modifierListsService.findOne({
      where: {
        squareId: squareModifierData?.modifierListId,
        catalogId: moaCatalogId,
      },
    });

    if (modifierLists == null) {
      throw new Error(
        `Modifier ${moaModifier.name} ${moaModifier.squareId} has no modifier list.`,
      );
    }

    moaModifier.modifierList = modifierLists;

    // TODO: what is up with onByDefault?
    // moaModifier.onByDefault = squareModifierData. ?? false;

    await this.save(moaModifier);
    if (!moaModifier.id) {
      throw new Error(
        `Modifier ${moaModifier.name} ${moaModifier.squareId} has no id.`,
      );
    }

    moaModifier.presentAtAllLocations =
      squareCatalogObject.presentAtAllLocations;
    const modifierPresentAtSquareLocationsIds =
      squareCatalogObject.presentAtLocationIds ?? [];
    if (modifierPresentAtSquareLocationsIds.length > 0) {
      moaModifier.presentAtLocations = moaLocations.filter((value) => {
        return (
          value.locationSquareId &&
          modifierPresentAtSquareLocationsIds.includes(value.locationSquareId)
        );
      });
    } else {
      moaModifier.presentAtLocations = [];
    }
    const modifierAbsentAtSquareLocationsIds =
      squareCatalogObject.absentAtLocationIds ?? [];
    if (modifierAbsentAtSquareLocationsIds.length > 0) {
      moaModifier.absentAtLocations = moaLocations.filter((value) => {
        return (
          value.locationSquareId &&
          modifierAbsentAtSquareLocationsIds.includes(value.locationSquareId)
        );
      });
    } else {
      moaModifier.absentAtLocations = [];
    }

    await this.modifierLocationOverridesService.process({
      forModifierWithId: moaModifier.id,
      squareModifierLocationOverrides:
        squareModifierData?.locationOverrides ?? [],
      moaLocations,
      moaCatalogId,
    });

    return await this.save(moaModifier);
  }
}
