import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  RemoveOptions,
  Repository,
} from 'typeorm';
import { ModifierList } from '../entities/modifier-list.entity';
import { Modifier } from '../entities/modifier.entity';

@Injectable()
export class ModifiersService {
  constructor(
    @InjectRepository(Modifier)
    private readonly repository: Repository<Modifier>,
  ) {}

  create(squareId: string, modifierList: ModifierList) {
    const entity = this.repository.create();
    entity.squareId = squareId;
    entity.modifierList = modifierList;
    return this.repository.save(entity);
  }

  save(entity: Modifier) {
    return this.repository.save(entity);
  }

  findByIds(ids: string[]) {
    return this.repository.findByIds(ids);
  }

  findMany(options?: FindManyOptions<Modifier>) {
    return this.repository.find(options);
  }

  findOne(options: FindOneOptions<Modifier>) {
    return this.repository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<Modifier>) {
    return this.repository.findOneOrFail(options);
  }

  //   update(input: MoaUpdateModifierInput) {
  //     return `This action updates a #${id} administrator`;
  //   }

  removeOne(entity: Modifier, options?: RemoveOptions): Promise<Modifier> {
    return this.repository.remove(entity, options);
  }

  removeAll(
    entities: Modifier[],
    options?: RemoveOptions,
  ): Promise<Modifier[]> {
    return this.repository.remove(entities, options);
  }

  async loadModifierListForModifier(
    modifier: Modifier,
  ): Promise<ModifierList | null | undefined> {
    return await this.repository
      .createQueryBuilder()
      .relation(Modifier, 'modifierList')
      .of(modifier)
      .loadOne();
  }
}
