import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  RemoveOptions,
  Repository,
} from 'typeorm';
import { Variation } from '../entities/variation.entity';

@Injectable()
export class VariationsService {
  constructor(
    @InjectRepository(Variation)
    private readonly repository: Repository<Variation>,
  ) {}

  create(params: { squareId: string; itemId: string; catalogId: string }) {
    const entity = this.repository.create();
    entity.squareId = params.squareId;
    entity.itemId = params.itemId;
    entity.catalogId = params.catalogId;
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
