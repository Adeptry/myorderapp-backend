import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  RemoveOptions,
  Repository,
} from 'typeorm';
import { MoaItemUpdateInput } from '../dto/item-update.dto';
import { Category } from '../entities/category.entity';
import { Item } from '../entities/item.entity';
import { ModifierList } from '../entities/modifier-list.entity';
import { Variation } from '../entities/variation.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly repository: Repository<Item>,
  ) {}

  create(squareId: string, category: Category) {
    const entity = this.repository.create();
    entity.squareId = squareId;
    entity.category = category;
    return this.repository.save(entity);
  }

  save(entity: Item) {
    return this.repository.save(entity);
  }

  findAndCount(options?: FindManyOptions<Item>) {
    return this.repository.findAndCount(options);
  }

  findMany(options?: FindManyOptions<Item>) {
    return this.repository.find(options);
  }

  findOne(options: FindOneOptions<Item>) {
    return this.repository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<Item>) {
    return this.repository.findOneOrFail(options);
  }

  async update(input: MoaItemUpdateInput) {
    const entity = await this.findOneOrFail({ where: { id: input.id } });
    this.applyUpdateToEntity(input, entity);
    return await this.save(entity);
  }

  saveAll(entities: Item[]) {
    return this.repository.save(entities);
  }

  async updateAll(inputs: MoaItemUpdateInput[]) {
    const entities: Item[] = [];

    for (const input of inputs) {
      const entity = await this.findOneOrFail({
        where: { id: input.id },
      });
      this.applyUpdateToEntity(input, entity);
      entities.push(entity);
    }

    return await this.saveAll(entities);
  }

  private applyUpdateToEntity(input: MoaItemUpdateInput, entity: Item) {
    if (input.moaOrdinal !== undefined) {
      entity.moaOrdinal = input.moaOrdinal;
    }
    if (input.moaEnabled !== undefined) {
      entity.moaEnabled = input.moaEnabled;
    }
  }

  removeOne(entity: Item, options?: RemoveOptions): Promise<Item> {
    return this.repository.remove(entity, options);
  }

  removeAll(entities: Item[], options?: RemoveOptions): Promise<Item[]> {
    return this.repository.remove(entities, options);
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
