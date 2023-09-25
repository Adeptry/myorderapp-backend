import {
  DeepPartial,
  FindOneOptions,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { AppLogger } from '../logger/app.logger.js';
import { EntityRepositoryService } from './entity-repository-service.js';
import { paginatedResults } from './paginated.js';
import { InfinityPaginationResultType } from './types/infinity-pagination-result.type.js';
import { PaginationOptions } from './types/pagination-options.js';

export abstract class RestfulEntityRepositoryService<
  Entity extends ObjectLiteral,
> extends EntityRepositoryService<Entity> {
  constructor(
    protected readonly repository: Repository<Entity>,
    protected readonly logger: AppLogger,
  ) {
    super(repository, logger);
  }

  async findAndPaginate(
    pagination: PaginationOptions,
  ): Promise<InfinityPaginationResultType<Entity>> {
    this.logger.verbose(this.findAndPaginate.name);
    return paginatedResults<Entity>({
      results: await this.repository.findAndCount({
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      pagination,
    });
  }

  async patchOne(
    where: FindOneOptions<Entity>,
    params: {
      patch: DeepPartial<Entity>;
    },
  ): Promise<Entity | null> {
    const { patch } = params;
    this.logger.verbose(this.patchOne.name);
    const result = await this.repository.findOne(where);
    await this.repository.save({ ...result, ...patch });
    return await this.repository.findOne(where);
  }
}
