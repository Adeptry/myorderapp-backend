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
import { CatalogObject } from 'square';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { VariationPatchBody } from '../dto/catalogs/variation-patch.dto.js';
import { VariationLocationOverride } from '../entities/variation-location-override.entity.js';
import { VariationEntity } from '../entities/variation.entity.js';
import { LocationsService } from './locations.service.js';
import { VariationLocationOverridesService } from './variation-location-overrides.service.js';

@Injectable()
export class VariationsService extends EntityRepositoryService<VariationEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(VariationEntity)
    protected readonly repository: Repository<VariationEntity>,
    protected readonly variationLocationOverridesService: VariationLocationOverridesService,
    protected readonly locationsService: LocationsService,
  ) {
    const logger = new Logger(VariationsService.name);
    super(repository, logger);
    this.logger = logger;
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
  async process(params: {
    squareCatalogObject: CatalogObject;
    catalogId: string;
    merchantId: string;
    moaItemId: string;
  }) {
    this.logger.verbose(this.process.name);
    const { squareCatalogObject, catalogId, merchantId, moaItemId } = params;
    const squareItemVariationData = squareCatalogObject.itemVariationData;

    const moaLocations = await this.locationsService.find({
      where: { merchantId },
    });

    if (!squareItemVariationData || !squareItemVariationData.itemId) {
      throw new Error(`No itemVariationData for ${squareCatalogObject.id}.`);
    }

    this.logger.debug(
      `Processing variation ${squareItemVariationData?.name} ${squareCatalogObject.id}.`,
    );
    let moaVariation = await this.findOne({
      where: {
        squareId: squareCatalogObject.id,
        catalogId,
      },
    });

    if (moaVariation == null) {
      moaVariation = this.create({
        squareId: squareCatalogObject.id,
        itemId: moaItemId,
        catalogId,
      });
    }

    moaVariation.synced = true;
    moaVariation.name = squareItemVariationData.name;
    moaVariation.ordinal = squareItemVariationData.ordinal;
    moaVariation.priceMoneyAmount =
      Number(squareItemVariationData.priceMoney?.amount ?? 0) ?? 0;

    await this.save(moaVariation);

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
          return value.squareId === override.locationId;
        });

        const moaVariationLocationOverride = new VariationLocationOverride();
        moaVariationLocationOverride.variationId = moaVariation.id;
        moaVariationLocationOverride.locationId =
          moaLocationForVariationOverride?.id;
        moaVariationLocationOverride.priceMoneyAmount = override.priceMoney
          ?.amount
          ? Number(override.priceMoney?.amount)
          : undefined;
        moaVariationLocationOverride.catalogId = catalogId;
        await this.variationLocationOverridesService.save(
          moaVariationLocationOverride,
        );
      }
    }

    return await this.save(moaVariation);
  }

  joinManyQuery(params: { itemId: string; locationId?: string }) {
    this.logger.verbose(this.joinManyQuery.name);
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
          '"variationLocationOverrides"."locationId" = :locationId',
          { locationId },
        )
        .addSelect(
          'COALESCE("variationLocationOverrides"."priceMoneyAmount", variations.priceMoneyAmount)',
          'variations_priceMoneyAmount',
        );
    }

    return query;
  }

  async updateOne(params: { id: string; input: VariationPatchBody }) {
    this.logger.verbose(this.updateOne.name);
    const entity = await this.findOneOrFail({ where: { id: params.id } });
    if (params.input.moaEnabled !== undefined) {
      entity.moaEnabled = params.input.moaEnabled;
    }
    return await this.save(entity);
  }
}
