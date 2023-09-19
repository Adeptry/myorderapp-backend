import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AppLogger } from '../logger/app.logger.js';
import { EntityRepositoryService } from '../utils/entity-repository-service.js';
import { paginatedResults } from '../utils/paginated.js';
import { InfinityPaginationResultType } from '../utils/types/infinity-pagination-result.type.js';
import { PaginationOptions } from '../utils/types/pagination-options.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService extends EntityRepositoryService<User> {
  constructor(
    @InjectRepository(User)
    protected repository: Repository<User>,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(UsersService.name);
    super(repository, logger);
  }

  async getMany(
    pagination: PaginationOptions,
  ): Promise<InfinityPaginationResultType<User>> {
    this.logger.verbose(this.getMany.name);
    return paginatedResults<User>({
      results: await this.repository.findAndCount({
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      pagination,
    });
  }

  async patch(id: string, payload: DeepPartial<User>): Promise<User | null> {
    this.logger.verbose(this.patch.name);
    const result = await this.repository.findOne({ where: { id } });
    await this.repository.save({ ...result, ...payload });
    return await this.repository.findOne({ where: { id } });
  }
}
