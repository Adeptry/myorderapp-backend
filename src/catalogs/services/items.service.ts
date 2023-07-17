import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { ItemUpdateAllDto, ItemUpdateDto } from '../dto/item-update.dto';
import { Item } from '../entities/item.entity';
import { ModifierList } from '../entities/modifier-list.entity';

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
    leftJoinDetails: boolean;
    whereEnabled?: boolean;
  }) {
    const {
      categoryId,
      locationId,
      page,
      limit,
      leftJoinDetails,
      whereEnabled,
    } = params;
    const query = this.createQueryBuilder('item')
      .leftJoinAndSelect('item.images', 'images')
      .where('item.categoryId = :categoryId', { categoryId });

    if (whereEnabled) {
      query.andWhere('item.moaEnabled = true');
    }

    if (locationId != null) {
      query.andWhere(
        '(EXISTS (SELECT 1 FROM items_present_at_locations WHERE locationId = :locationId AND itemId = item.id) OR ' +
          '(item.presentAtAllLocations = true AND NOT EXISTS (SELECT 1 FROM items_absent_at_locations WHERE locationId = :locationId AND itemId = item.id)))',
        { locationId },
      );
    }

    if (leftJoinDetails) {
      query
        .leftJoinAndSelect('item.variations', 'variations')
        .leftJoinAndSelect('item.modifierLists', 'modifierLists')
        .leftJoinAndSelect('modifierLists.modifiers', 'modifiers');

      if (whereEnabled) {
        query.andWhere('modifierLists.enabled = true');
      }

      if (locationId != null) {
        query.andWhere(
          '(EXISTS (SELECT 1 FROM modifiers_present_at_locations WHERE locationId = :locationId AND modifierId = modifiers.id) OR ' +
            '(modifiers.presentAtAllLocations = true AND NOT EXISTS (SELECT 1 FROM modifiers_absent_at_locations WHERE locationId = :locationId AND modifierId = modifiers.id)))',
          { locationId },
        );
      }
    }

    return query
      .orderBy('item.moaOrdinal', 'ASC')
      .take(limit)
      .skip(page && limit && (page - 1) * limit);
  }

  joinOneQuery(params: { id: string; locationId?: string }) {
    const { id, locationId } = params;
    const query = this.createQueryBuilder('item')
      .leftJoinAndSelect('item.variations', 'variations')
      .leftJoinAndSelect('item.images', 'images')
      .leftJoinAndSelect('item.modifierLists', 'modifierList')
      .leftJoinAndSelect('modifierList.modifiers', 'modifiers')
      .where('item.id = :id', { id });

    if (locationId) {
      query.andWhere(
        '(EXISTS (SELECT 1 FROM modifiers_present_at_locations WHERE locationId = :locationId AND modifierId = modifiers.id) OR ' +
          '(modifiers.presentAtAllLocations = true AND NOT EXISTS (SELECT 1 FROM modifiers_absent_at_locations WHERE locationId = :locationId AND modifierId = modifiers.id)))',
        { locationId },
      );
    }

    return query;
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
