import {
  DeepPartial,
  FindOneOptions,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { buildPaginatedResults } from './build-paginated-results.js';
import { EntityRepositoryService } from './entity-repository-service.js';
import { PaginationOptionsInput } from './pagination-options-input.dto.js';
import { PaginationResultType } from './pagination-result.type.js';
import { RepositoryServiceLogger } from './reposistory-service-logger.js';

export abstract class RestfulEntityRepositoryService<
  Entity extends ObjectLiteral,
> extends EntityRepositoryService<Entity> {
  constructor(
    protected readonly repository: Repository<Entity>,
    protected readonly logger: RepositoryServiceLogger,
  ) {
    super(repository, logger);
  }

  async findAndPaginate(
    pagination: PaginationOptionsInput,
  ): Promise<PaginationResultType<Entity>> {
    this.logger.verbose(this.findAndPaginate.name);
    return buildPaginatedResults<Entity>({
      results: await this.repository.findAndCount({
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      pagination,
    });
  }

  async patch(
    where: FindOneOptions<Entity>,
    patch: DeepPartial<Entity>,
  ): Promise<Entity | null> {
    this.logger.verbose(this.patch.name);
    const result = await this.repository.findOne(where);
    await this.repository.save({ ...result, ...patch });
    return await this.repository.findOne(where);
  }
}
