import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  RemoveOptions,
  Repository,
} from 'typeorm';
import { MoaModifierList } from '../entities/modifier-list.entity';
import { MoaModifier } from '../entities/modifier.entity';

@Injectable()
export class ModifiersService {
  constructor(
    @InjectRepository(MoaModifier)
    private readonly repository: Repository<MoaModifier>,
  ) {}

  create(squareId: string, modifierList: MoaModifierList) {
    const entity = this.repository.create();
    entity.squareId = squareId;
    entity.modifierList = modifierList;
    return this.repository.save(entity);
  }

  save(entity: MoaModifier) {
    return this.repository.save(entity);
  }

  findByIds(ids: string[]) {
    return this.repository.findByIds(ids);
  }

  findMany(options?: FindManyOptions<MoaModifier>) {
    return this.repository.find(options);
  }

  findOne(options: FindOneOptions<MoaModifier>) {
    return this.repository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<MoaModifier>) {
    return this.repository.findOneOrFail(options);
  }

  //   update(input: MoaUpdateModifierInput) {
  //     return `This action updates a #${id} administrator`;
  //   }

  removeOne(
    entity: MoaModifier,
    options?: RemoveOptions,
  ): Promise<MoaModifier> {
    return this.repository.remove(entity, options);
  }

  removeAll(
    entities: MoaModifier[],
    options?: RemoveOptions,
  ): Promise<MoaModifier[]> {
    return this.repository.remove(entities, options);
  }

  async loadModifierListForModifier(
    modifier: MoaModifier,
  ): Promise<MoaModifierList | null | undefined> {
    return await this.repository
      .createQueryBuilder()
      .relation(MoaModifier, 'modifierList')
      .of(modifier)
      .loadOne();
  }
}
