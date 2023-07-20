import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ItemUpdateAllDto,
  ItemUpdateDto,
} from 'src/catalogs/dto/item-update.dto';
import { Item } from 'src/catalogs/entities/item.entity';
import { ModifierList } from 'src/catalogs/entities/modifier-list.entity';
import { BaseService } from 'src/utils/base-service';
import { Repository, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class ItemsService extends BaseService<Item> {
  constructor(
    @InjectRepository(Item)
    protected readonly repository: Repository<Item>,
  ) {
    super(repository);
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
    const { locationId } = params;

    return this.join(
      this.createQueryBuilder('item').where('item.id = :id', {
        id: params.id,
      }),
      { locationId },
    );
  }

  private join(
    query: SelectQueryBuilder<Item>,
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
        '(EXISTS (SELECT 1 FROM items_present_at_locations WHERE locationId = :locationId AND itemId = item.id) OR ' +
          '(item.presentAtAllLocations = true AND NOT EXISTS (SELECT 1 FROM items_absent_at_locations WHERE locationId = :locationId AND itemId = item.id)))',
        { locationId },
      );
    }

    if (leftJoinModifierLists) {
      query
        .leftJoinAndSelect('item.modifierLists', 'modifierLists')
        .leftJoinAndSelect('modifierLists.modifiers', 'modifiers');

      if (whereOnlyEnabled) {
        query.andWhere('modifierLists.enabled = true');
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
            '(EXISTS (SELECT 1 FROM modifiers_present_at_locations WHERE locationId = :locationId AND modifierId = modifiers.id) OR ' +
              '(modifiers.presentAtAllLocations = true AND NOT EXISTS (SELECT 1 FROM modifiers_absent_at_locations WHERE locationId = :locationId AND modifierId = modifiers.id)))',
            { locationId },
          )
          .addSelect(
            'COALESCE(modifierLocationOverrides.amount, modifiers.priceInCents)',
            'modifiers_priceInCents',
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
            'variationLocationOverrides.locationId = :locationId',
            { locationId },
          )
          .addSelect(
            'COALESCE(variationLocationOverrides.amount, variations.priceInCents)',
            'variations_priceInCents',
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

  async assignAndSave(params: { id: string; input: ItemUpdateDto }) {
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
    const entities: Item[] = [];

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

  async loadModifierLists(entity: Item): Promise<ModifierList[]> {
    return this.repository
      .createQueryBuilder()
      .relation(Item, 'modifierLists')
      .of(entity)
      .loadMany();
  }
}
