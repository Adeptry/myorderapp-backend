import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  RemoveOptions,
  Repository,
} from 'typeorm';
import { MoaItemUpdateInput } from '../dto/item-update.dto';
import { MoaCategory } from '../entities/category.entity';
import { MoaItem } from '../entities/item.entity';
import { MoaModifierList } from '../entities/modifier-list.entity';
import { MoaVariation } from '../entities/variation.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(MoaItem)
    private readonly repository: Repository<MoaItem>,
  ) {}

  create(squareId: string, category: MoaCategory) {
    const entity = this.repository.create();
    entity.squareId = squareId;
    entity.category = category;
    return this.repository.save(entity);
  }

  save(entity: MoaItem) {
    return this.repository.save(entity);
  }

  findAndCount(options?: FindManyOptions<MoaItem>) {
    return this.repository.findAndCount(options);
  }

  findMany(options?: FindManyOptions<MoaItem>) {
    return this.repository.find(options);
  }

  findOne(options: FindOneOptions<MoaItem>) {
    return this.repository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<MoaItem>) {
    return this.repository.findOneOrFail(options);
  }

  async update(input: MoaItemUpdateInput) {
    const entity = await this.findOneOrFail({ where: { moaId: input.moaId } });
    this.applyUpdateToEntity(input, entity);
    return await this.save(entity);
  }

  saveAll(entities: MoaItem[]) {
    return this.repository.save(entities);
  }

  async updateAll(inputs: MoaItemUpdateInput[]) {
    const entities: MoaItem[] = [];

    for (const input of inputs) {
      const entity = await this.findOneOrFail({
        where: { moaId: input.moaId },
      });
      this.applyUpdateToEntity(input, entity);
      entities.push(entity);
    }

    return await this.saveAll(entities);
  }

  private applyUpdateToEntity(input: MoaItemUpdateInput, entity: MoaItem) {
    if (input.moaOrdinal !== undefined) {
      entity.moaOrdinal = input.moaOrdinal;
    }
    if (input.moaEnabled !== undefined) {
      entity.moaEnabled = input.moaEnabled;
    }
  }

  removeOne(entity: MoaItem, options?: RemoveOptions): Promise<MoaItem> {
    return this.repository.remove(entity, options);
  }

  removeAll(entities: MoaItem[], options?: RemoveOptions): Promise<MoaItem[]> {
    return this.repository.remove(entities, options);
  }

  async loadCategoryForItem(
    entity: MoaItem,
  ): Promise<MoaCategory | null | undefined> {
    return await this.repository
      .createQueryBuilder()
      .relation(MoaItem, 'category')
      .of(entity)
      .loadOne();
  }

  async loadVariations(entity: MoaItem): Promise<MoaVariation[]> {
    return this.repository
      .createQueryBuilder()
      .relation(MoaItem, 'variations')
      .of(entity)
      .loadMany();
  }

  async loadModifierLists(entity: MoaItem): Promise<MoaModifierList[]> {
    return this.repository
      .createQueryBuilder()
      .relation(MoaItem, 'modifierLists')
      .of(entity)
      .loadMany();
  }
}
