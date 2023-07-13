import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { ItemUpdateAllInput, ItemUpdateInput } from '../dto/item-update.dto';
import { Category } from '../entities/category.entity';
import { Item } from '../entities/item.entity';
import { ModifierList } from '../entities/modifier-list.entity';
import { Variation } from '../entities/variation.entity';

@Injectable()
export class ItemsService extends BaseService<Item> {
  constructor(
    @InjectRepository(Item)
    protected readonly repository: Repository<Item>,
  ) {
    super(repository);
  }

  async assignAndSave(params: { id: string; input: ItemUpdateInput }) {
    const entity = await this.findOneOrFail({ where: { id: params.id } });
    if (params.input.moaOrdinal !== undefined) {
      entity.moaOrdinal = params.input.moaOrdinal;
    }
    if (params.input.moaEnabled !== undefined) {
      entity.moaEnabled = params.input.moaEnabled;
    }
    return await this.save(entity);
  }

  async updateAll(inputs: ItemUpdateAllInput[]) {
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

  async loadCategoryForItem(
    entity: Item,
  ): Promise<Category | null | undefined> {
    return await this.repository
      .createQueryBuilder()
      .relation(Item, 'category')
      .of(entity)
      .loadOne();
  }

  async loadVariations(entity: Item): Promise<Variation[]> {
    return this.repository
      .createQueryBuilder()
      .relation(Item, 'variations')
      .of(entity)
      .loadMany();
  }

  async loadModifierLists(entity: Item): Promise<ModifierList[]> {
    return this.repository
      .createQueryBuilder()
      .relation(Item, 'modifierLists')
      .of(entity)
      .loadMany();
  }
}
