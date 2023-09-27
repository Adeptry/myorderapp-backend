import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { EntityRepositoryService } from '../../../utils/entity-repository-service.js';
import {
  ItemUpdateAllDto,
  ItemUpdateDto,
} from '../../dto/catalogs/item-update.dto.js';
import { ItemEntity } from '../../entities/catalogs/item.entity.js';

@Injectable()
export class ItemsService extends EntityRepositoryService<ItemEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(ItemEntity)
    protected readonly repository: Repository<ItemEntity>,
  ) {
    const logger = new Logger(ItemsService.name);
    super(repository, logger);
    this.logger = logger;
  }

  joinManyQuery(params: {
    categoryId: string;
    locationId?: string;
    page?: number;
    limit?: number;
    leftJoinVariations?: boolean;
    leftJoinModifierLists?: boolean;
    leftJoinImages?: boolean;
    whereOnlyEnabled?: boolean;
  }) {
    this.logger.verbose(this.joinManyQuery.name);

    const {
      categoryId,
      locationId,
      page,
      limit,
      leftJoinVariations,
      leftJoinModifierLists,
      leftJoinImages,
      whereOnlyEnabled,
    } = params;

    return this.join(
      this.createQueryBuilder('item').where('item.categoryId = :categoryId', {
        categoryId,
      }),
      {
        locationId,
        page,
        limit,
        leftJoinVariations,
        leftJoinModifierLists,
        leftJoinImages,
        whereOnlyEnabled,
      },
    );
  }

  joinOneQuery(params: {
    id: string;
    locationId?: string;
    leftJoinVariations?: boolean;
    leftJoinModifierLists?: boolean;
    leftJoinImages?: boolean;
    whereOnlyEnabled?: boolean;
  }) {
    this.logger.verbose(this.joinOneQuery.name);
    const {
      locationId,
      leftJoinVariations,
      leftJoinModifierLists,
      leftJoinImages,
      whereOnlyEnabled,
    } = params;

    return this.join(
      this.createQueryBuilder('item').where('item.id = :id', {
        id: params.id,
      }),
      {
        locationId,
        leftJoinVariations,
        leftJoinModifierLists,
        leftJoinImages,
        whereOnlyEnabled,
      },
    );
  }

  private join(
    query: SelectQueryBuilder<ItemEntity>,
    params: {
      locationId?: string;
      page?: number;
      limit?: number;
      leftJoinVariations?: boolean;
      leftJoinModifierLists?: boolean;
      leftJoinImages?: boolean;
      whereOnlyEnabled?: boolean;
    },
  ) {
    this.logger.verbose(this.join.name);
    const {
      locationId,
      leftJoinModifierLists,
      leftJoinVariations,
      leftJoinImages,
      whereOnlyEnabled,
      page,
      limit,
    } = params;

    if (whereOnlyEnabled) {
      query.andWhere('item.moaEnabled = true');
    }

    if (leftJoinImages) {
      query.leftJoinAndSelect('item.images', 'images');
    }

    if (locationId != null) {
      query.andWhere(
        '(EXISTS (SELECT 1 FROM items_present_at_locations WHERE "locationId" = :locationId AND "itemId" = item.id) OR ' +
          '(item.presentAtAllLocations = true AND NOT EXISTS (SELECT 1 FROM items_absent_at_locations WHERE "locationId" = :locationId AND "itemId" = item.id)))',
        { locationId },
      );
    }

    if (leftJoinModifierLists) {
      query
        .leftJoinAndSelect('item.itemModifierLists', 'itemModifierLists')
        .leftJoinAndSelect('itemModifierLists.modifierList', 'modifierLists')
        .leftJoinAndSelect('modifierLists.modifiers', 'modifiers');

      if (whereOnlyEnabled) {
        query.andWhere(
          new Brackets((qb) => {
            qb.where('itemModifierLists.enabled = true').orWhere(
              'itemModifierLists.enabled IS NULL',
            );
          }),
        );
      }

      if (locationId) {
        query
          .leftJoinAndSelect(
            'modifiers.locationOverrides',
            'modifierLocationOverrides',
            'modifierLocationOverrides.locationId = :locationId',
            { locationId },
          )
          .andWhere(
            '(EXISTS (SELECT 1 FROM modifiers_present_at_locations WHERE "locationId" = :locationId AND "modifierId" = modifiers.id) OR ' +
              '(modifiers.presentAtAllLocations = true AND NOT EXISTS (SELECT 1 FROM modifiers_absent_at_locations WHERE "locationId" = :locationId AND "modifierId" = modifiers.id)))',
            { locationId },
          )
          .addSelect(
            'COALESCE(modifierLocationOverrides.amount, modifiers.priceAmount)',
            'modifiers_priceAmount',
          )
          .addSelect(
            'COALESCE(modifierLocationOverrides.currency, modifiers.priceCurrency)',
            'modifiers_priceCurrency',
          );
      }
    }

    if (leftJoinVariations) {
      query.leftJoinAndSelect('item.variations', 'variations');

      if (locationId) {
        query
          .leftJoinAndSelect(
            'variations.locationOverrides',
            'variationLocationOverrides',
            '"variationLocationOverrides"."locationId" = :locationId',
            { locationId },
          )
          .addSelect(
            'COALESCE("variationLocationOverrides".amount, variations.priceAmount)',
            'variations_priceAmount',
          );
      }
    }

    if (limit) {
      query.take(limit);
    }

    if (page && limit) {
      query.skip(limit && (page - 1) * limit);
    }

    return query.orderBy('item.moaOrdinal', 'ASC');
  }

  async updateOne(params: { id: string; input: ItemUpdateDto }) {
    this.logger.verbose(this.updateOne.name);
    const entity = await this.findOneOrFail({ where: { id: params.id } });
    if (params.input.moaOrdinal !== undefined) {
      entity.moaOrdinal = params.input.moaOrdinal;
    }
    if (params.input.moaEnabled !== undefined) {
      entity.moaEnabled = params.input.moaEnabled;
    }
    return await this.save(entity);
  }

  async updateAll(inputs: ItemUpdateAllDto[]) {
    this.logger.verbose(this.updateAll.name);
    const entities: ItemEntity[] = [];

    for (const input of inputs) {
      const entity = await this.findOneOrFail({
        where: { id: input.id },
      });
      if (input.moaOrdinal !== undefined) {
        entity.moaOrdinal = input.moaOrdinal;
      }
      if (input.moaEnabled !== undefined) {
        entity.moaEnabled = input.moaEnabled;
      }
      entities.push(entity);
    }

    return await this.saveAll(entities);
  }
}
