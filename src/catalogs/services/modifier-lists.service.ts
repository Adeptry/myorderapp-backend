import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  RemoveOptions,
  Repository,
} from 'typeorm';
import { Item } from '../entities/item.entity';
import { ModifierList } from '../entities/modifier-list.entity';

@Injectable()
export class ModifierListsService {
  constructor(
    @InjectRepository(ModifierList)
    private readonly repository: Repository<ModifierList>,
  ) {}

  create(squareId: string) {
    const entity = this.repository.create();
    entity.squareId = squareId;
    return this.repository.save(entity);
  }

  save(entity: ModifierList) {
    return this.repository.save(entity);
  }

  findByIds(ids: string[]) {
    return this.repository.findByIds(ids);
  }

  findMany(options?: FindManyOptions<ModifierList>) {
    return this.repository.find(options);
  }

  findOne(options: FindOneOptions<ModifierList>) {
    return this.repository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<ModifierList>) {
    return this.repository.findOneOrFail(options);
  }

  //   update(input: MoaUpdateModiferListInput) {
  //     return `This action updates a #${id} administrator`;
  //   }

  removeOne(
    entity: ModifierList,
    options?: RemoveOptions,
  ): Promise<ModifierList> {
    return this.repository.remove(entity, options);
  }

  removeAll(
    entities: ModifierList[],
    options?: RemoveOptions,
  ): Promise<ModifierList[]> {
    return this.repository.remove(entities, options);
  }

  async loadItemsForModifierList(modifierList: ModifierList): Promise<Item[]> {
    return this.repository
      .createQueryBuilder()
      .relation(ModifierList, 'items')
      .of(modifierList)
      .loadMany();
  }
}
