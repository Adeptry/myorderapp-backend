import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoaCatalog } from 'src/catalogs/entities/catalog.entity';
import { paginated } from 'src/utils/paginated';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';
import { PaginationOptions } from 'src/utils/types/pagination-options';
import {
  FindManyOptions,
  FindOneOptions,
  RemoveOptions,
  Repository,
} from 'typeorm';
import { MoaCategoryUpdateInput } from '../dto/category-update.dto';
import { MoaCategory } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(MoaCategory)
    private readonly repository: Repository<MoaCategory>,
  ) {}

  create(squareId: string, catalog: MoaCatalog) {
    const entity = this.repository.create();
    entity.squareId = squareId;
    entity.catalog = catalog;
    return this.repository.save(entity);
  }

  save(entity: MoaCategory) {
    return this.repository.save(entity);
  }

  findByIds(ids: string[]) {
    return this.repository.findByIds(ids);
  }

  findMany(options?: FindManyOptions<MoaCategory>) {
    return this.repository.find(options);
  }

  findOne(options: FindOneOptions<MoaCategory>) {
    return this.repository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<MoaCategory>) {
    return this.repository.findOneOrFail(options);
  }

  async update(input: MoaCategoryUpdateInput) {
    const entity = await this.findOneOrFail({ where: { moaId: input.moaId } });
    if (input.moaOrdinal !== undefined) {
      entity.moaOrdinal = input.moaOrdinal;
    }
    if (input.moaEnabled !== undefined) {
      entity.moaEnabled = input.moaEnabled;
    }
    return await this.save(entity);
  }

  saveAll(entities: MoaCategory[]) {
    return this.repository.save(entities);
  }

  async updateAll(inputs: MoaCategoryUpdateInput[]) {
    const entities: MoaCategory[] = [];

    for (const input of inputs) {
      const entity = await this.findOneOrFail({
        where: { moaId: input.moaId },
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

  removeOne(
    entity: MoaCategory,
    options?: RemoveOptions,
  ): Promise<MoaCategory> {
    return this.repository.remove(entity, options);
  }

  removeAll(
    entities: MoaCategory[],
    options?: RemoveOptions,
  ): Promise<MoaCategory[]> {
    return this.repository.remove(entities, options);
  }

  async getManyCategories(params: {
    catalogMoaId: string;
    pagination: PaginationOptions;
    onlyShowEnabled?: boolean;
  }): Promise<InfinityPaginationResultType<MoaCategory>> {
    if (!params.catalogMoaId) {
      throw new BadRequestException('catalogMoaId is required');
    }

    const query = this.repository
      .createQueryBuilder('category')
      .where('category.catalogMoaId = :catalogMoaId', {
        catalogMoaId: params.catalogMoaId,
      })
      .orderBy('category.moaOrdinal', 'ASC');
    // .leftJoinAndSelect(`category.image`, `image`);

    if (params) {
      query.skip((params.pagination.page - 1) * params.pagination.limit);
      query.take(params.pagination.limit);
    }

    if (params.onlyShowEnabled) {
      query.andWhere('location.moaEnabled = true');
    }

    const result = await query.getManyAndCount();

    return paginated({
      data: result[0],
      count: result[1],
      pagination: params.pagination,
    });
  }
}
