import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Catalog } from 'src/catalogs/entities/catalog.entity';
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
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  create(squareId: string, catalog: Catalog) {
    const entity = this.repository.create();
    entity.squareId = squareId;
    entity.catalog = catalog;
    return this.repository.save(entity);
  }

  save(entity: Category) {
    return this.repository.save(entity);
  }

  findByIds(ids: string[]) {
    return this.repository.findByIds(ids);
  }

  findMany(options?: FindManyOptions<Category>) {
    return this.repository.find(options);
  }

  findOne(options: FindOneOptions<Category>) {
    return this.repository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<Category>) {
    return this.repository.findOneOrFail(options);
  }

  async update(input: MoaCategoryUpdateInput) {
    const entity = await this.findOneOrFail({ where: { id: input.id } });
    if (input.moaOrdinal !== undefined) {
      entity.moaOrdinal = input.moaOrdinal;
    }
    if (input.moaEnabled !== undefined) {
      entity.moaEnabled = input.moaEnabled;
    }
    return await this.save(entity);
  }

  saveAll(entities: Category[]) {
    return this.repository.save(entities);
  }

  async updateAll(inputs: MoaCategoryUpdateInput[]) {
    const entities: Category[] = [];

    for (const input of inputs) {
      const entity = await this.findOneOrFail({
        where: { id: input.id },
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

  removeOne(entity: Category, options?: RemoveOptions): Promise<Category> {
    return this.repository.remove(entity, options);
  }

  removeAll(
    entities: Category[],
    options?: RemoveOptions,
  ): Promise<Category[]> {
    return this.repository.remove(entities, options);
  }

  async getManyCategories(params: {
    catalogId: string;
    pagination: PaginationOptions;
    onlyShowEnabled?: boolean;
  }): Promise<InfinityPaginationResultType<Category>> {
    if (!params.catalogId) {
      throw new BadRequestException('catalogId is required');
    }

    const query = this.repository
      .createQueryBuilder('category')
      .where('category.catalogId = :catalogId', {
        catalogId: params.catalogId,
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
