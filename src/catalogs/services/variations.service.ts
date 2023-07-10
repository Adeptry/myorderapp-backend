import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  RemoveOptions,
  Repository,
} from 'typeorm';
import { Item } from '../entities/item.entity';
import { Variation } from '../entities/variation.entity';

@Injectable()
export class VariationsService {
  constructor(
    @InjectRepository(Variation)
    private readonly repository: Repository<Variation>,
  ) {}

  create(params: { squareId: string; item: Item }) {
    const entity = this.repository.create();
    entity.squareId = params.squareId;
    entity.item = params.item;
    entity.itemId = params.item.id;
    return this.repository.save(entity);
  }

  save(entity: Variation) {
    return this.repository.save(entity);
  }

  findMany(options?: FindManyOptions<Variation>) {
    return this.repository.find(options);
  }

  findOne(options: FindOneOptions<Variation>) {
    return this.repository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<Variation>) {
    return this.repository.findOneOrFail(options);
  }

  //   update(input: MoaUpdateVariationInput) {
  //     return `This action updates a #${id} administrator`;
  //   }

  removeOne(entity: Variation, options?: RemoveOptions): Promise<Variation> {
    return this.repository.remove(entity, options);
  }

  removeAll(
    entities: Variation[],
    options?: RemoveOptions,
  ): Promise<Variation[]> {
    return this.repository.remove(entities, options);
  }
}
