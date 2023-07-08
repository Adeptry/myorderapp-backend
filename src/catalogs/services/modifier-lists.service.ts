import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  RemoveOptions,
  Repository,
} from 'typeorm';
import { MoaItem } from '../entities/item.entity';
import { MoaModifierList } from '../entities/modifier-list.entity';

@Injectable()
export class ModifierListsService {
  constructor(
    @InjectRepository(MoaModifierList)
    private readonly repository: Repository<MoaModifierList>,
  ) {}

  create(squareId: string) {
    const entity = this.repository.create();
    entity.squareId = squareId;
    return this.repository.save(entity);
  }

  save(entity: MoaModifierList) {
    return this.repository.save(entity);
  }

  findByIds(ids: string[]) {
    return this.repository.findByIds(ids);
  }

  findMany(options?: FindManyOptions<MoaModifierList>) {
    return this.repository.find(options);
  }

  findOne(options: FindOneOptions<MoaModifierList>) {
    return this.repository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<MoaModifierList>) {
    return this.repository.findOneOrFail(options);
  }

  //   update(input: MoaUpdateModiferListInput) {
  //     return `This action updates a #${id} administrator`;
  //   }

  removeOne(
    entity: MoaModifierList,
    options?: RemoveOptions,
  ): Promise<MoaModifierList> {
    return this.repository.remove(entity, options);
  }

  removeAll(
    entities: MoaModifierList[],
    options?: RemoveOptions,
  ): Promise<MoaModifierList[]> {
    return this.repository.remove(entities, options);
  }

  async loadItemForModifierList(
    modifierList: MoaModifierList,
  ): Promise<MoaItem | null | undefined> {
    return this.repository
      .createQueryBuilder()
      .relation(MoaModifierList, 'item')
      .of(modifierList)
      .loadOne();
  }
}
