import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { paginated } from 'src/utils/paginated';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';
import { PaginationOptions } from 'src/utils/types/pagination-options';
import { Repository } from 'typeorm';
import {
  CategoryUpdateAllInput,
  CategoryUpdateInput,
} from '../dto/category-update.dto';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService extends BaseService<Category> {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    protected readonly repository: Repository<Category>,
  ) {
    super(repository);
  }

  async assignAndSave(params: { id: string; input: CategoryUpdateInput }) {
    const entity = await this.findOneOrFail({
      where: { id: params.id },
    });
    if (params.input.moaOrdinal != undefined) {
      this.logger.verbose(
        `Updating category ${params.id} moaOrdinal: ${params.input.moaOrdinal}`,
      );
      entity.moaOrdinal = params.input.moaOrdinal;
    }
    if (params.input.moaEnabled != undefined) {
      entity.moaEnabled = params.input.moaEnabled;
    }
    return await this.save(entity);
  }

  async updateAll(inputs: CategoryUpdateAllInput[]) {
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
