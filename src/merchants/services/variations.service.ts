import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  RemoveOptions,
  Repository,
} from 'typeorm';
import { MoaItem } from '../entities/item.entity';
import { MoaVariation } from '../entities/variation.entity';

@Injectable()
export class VariationsService {
  constructor(
    @InjectRepository(MoaVariation)
    private readonly repository: Repository<MoaVariation>,
  ) {}

  create(params: { squareId: string; item: MoaItem }) {
    const entity = this.repository.create();
    entity.squareId = params.squareId;
    entity.item = params.item;
    entity.itemMoaId = params.item.moaId;
    return this.repository.save(entity);
  }

  save(entity: MoaVariation) {
    return this.repository.save(entity);
  }

  findMany(options?: FindManyOptions<MoaVariation>) {
    return this.repository.find(options);
  }

  findOne(options: FindOneOptions<MoaVariation>) {
    return this.repository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<MoaVariation>) {
    return this.repository.findOneOrFail(options);
  }

  //   update(input: MoaUpdateVariationInput) {
  //     return `This action updates a #${id} administrator`;
  //   }

  removeOne(
    entity: MoaVariation,
    options?: RemoveOptions,
  ): Promise<MoaVariation> {
    return this.repository.remove(entity, options);
  }

  removeAll(
    entities: MoaVariation[],
    options?: RemoveOptions,
  ): Promise<MoaVariation[]> {
    return this.repository.remove(entities, options);
  }
}
