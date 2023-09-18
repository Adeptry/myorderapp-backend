import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogObject } from 'square';
import { Repository } from 'typeorm';
import { Variation } from '../../catalogs/entities/variation.entity.js';
import { Location } from '../../locations/entities/location.entity.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';
import { VariationUpdateDto } from '../dto/variation-update.dto.js';
import { VariationLocationOverride } from '../entities/variation-location-override.entity.js';
import { VariationLocationOverridesService } from './variation-location-overrides.service.js';

@Injectable()
export class VariationsService extends EntityRepositoryService<Variation> {
  private readonly logger = new Logger(VariationsService.name);

  constructor(
    @InjectRepository(Variation)
    protected readonly repository: Repository<Variation>,
    protected readonly variationLocationOverridesService: VariationLocationOverridesService,
  ) {
    super(repository);
  }

  /*
  TODO measurement unid ID
    {
      "type": "ITEM_VARIATION",
      "id": "BFUSZWSXHLPFHGURT3RGAP36",
      "present_at_all_locations": false,
      "present_at_location_ids": [
        "L3XVVEYYRJN4F",
        "LE27K4BS6ZFEP",
        "LNND56HBQ4EB6"
      ],
      "item_variation_data": {
        "item_id": "QM4MACMQW6JGIPTCGZR6IRQR",
        "name": "Small (12 oz.)",
        "ordinal": 1,
        "pricing_type": "FIXED_PRICING",
        "price_money": {
          "amount": 360,
          "currency": "USD"
        },
        "location_overrides": [
          {
            "location_id": "L3XVVEYYRJN4F",
            "price_money": {
              "amount": 500,
              "currency": "USD"
            },
            "pricing_type": "FIXED_PRICING"
          }
        ],
        "sellable": true,
        "stockable": true
      }
    },

  */
  async processAndSave(params: {
    squareCatalogObject: CatalogObject;
    moaCatalogId: string;
    moaLocations: Location[];
    moaItemId: string;
  }) {
    const { squareCatalogObject, moaCatalogId, moaLocations, moaItemId } =
      params;
    const squareItemVariationData = squareCatalogObject.itemVariationData;

    if (!squareItemVariationData) {
      throw new Error(`No itemVariationData for ${squareCatalogObject.id}.`);
    }

    this.logger.verbose(
      `Processing variation ${squareItemVariationData?.name} ${squareCatalogObject.id}.`,
    );
    let moaVariation = await this.findOne({
      where: {
        squareId: squareCatalogObject.id,
        catalogId: moaCatalogId,
      },
    });

    if (moaVariation == null) {
      moaVariation = this.create({
        squareId: squareCatalogObject.id,
        itemId: moaItemId,
        catalogId: moaCatalogId,
      });
    }

    moaVariation.name = squareItemVariationData.name;
    moaVariation.ordinal = squareItemVariationData.ordinal;
    moaVariation.priceAmount =
      Number(squareItemVariationData.priceMoney?.amount ?? 0) ?? 0;
    moaVariation.priceCurrency = squareItemVariationData.priceMoney?.currency;

    try {
      await this.save(moaVariation);
    } catch (error: any) {
      this.logger.log(error);
    }

    const squareVariationLocationOverrides =
      squareItemVariationData.locationOverrides;

    if (squareVariationLocationOverrides) {
      // First, delete all existing VariationLocationOverrides for this moaVariation
      const existingVariationLocationOverrides =
        await this.variationLocationOverridesService.find({
          where: {
            variationId: moaVariation.id,
          },
        });
      for (const existingOverride of existingVariationLocationOverrides) {
        await this.variationLocationOverridesService.remove(existingOverride);
      }

      // Then, recreate them based on the current Square data
      for (const override of squareVariationLocationOverrides) {
        const moaLocationForVariationOverride = moaLocations.find((value) => {
          return value.locationSquareId === override.locationId;
        });

        const moaVariationLocationOverride = new VariationLocationOverride();
        moaVariationLocationOverride.variationId = moaVariation.id;
        moaVariationLocationOverride.locationId =
          moaLocationForVariationOverride?.id;
        moaVariationLocationOverride.amount = Number(
          override.priceMoney?.amount ?? 0,
        );
        moaVariationLocationOverride.currency = override.priceMoney?.currency;

        await this.variationLocationOverridesService.save(
          moaVariationLocationOverride,
        );
      }
    }

    return await this.save(moaVariation);
  }

  joinManyQuery(params: { itemId: string; locationId?: string }) {
    const { itemId, locationId } = params;

    const query = this.createQueryBuilder('variations').where(
      'variations.itemId = :itemId',
      {
        itemId,
      },
    );

    if (locationId) {
      query
        .leftJoinAndSelect(
          'variations.locationOverrides',
          'variationLocationOverrides',
          'variationLocationOverrides.locationId = :locationId',
          { locationId },
        )
        .addSelect(
          'COALESCE(variationLocationOverrides.amount, variations.priceAmount)',
          'variations_priceAmount',
        );
    }

    return query;
  }

  async assignAndSave(params: { id: string; input: VariationUpdateDto }) {
    const entity = await this.findOneOrFail({ where: { id: params.id } });
    if (params.input.moaEnabled !== undefined) {
      entity.moaEnabled = params.input.moaEnabled;
    }
    return await this.save(entity);
  }
}
