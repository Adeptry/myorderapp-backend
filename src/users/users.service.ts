import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
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
  ) {
    super(repository);
  }

  get(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async getMany(
    pagination: PaginationOptions,
  ): Promise<InfinityPaginationResultType<User>> {
    return paginatedResults<User>({
      results: await this.repository.findAndCount({
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      pagination,
    });
  }

  async patch(id: string, payload: DeepPartial<User>): Promise<User | null> {
    const result = await this.repository.findOne({ where: { id } });
    await this.repository.save({ ...result, ...payload });
    return await this.repository.findOne({ where: { id } });
  }

  put(id: string, entity: DeepPartial<User>): Promise<DeepPartial<User>> {
    return this.save({
      id,
      ...entity,
    });
  }

  delete(id: string) {
    return this.softDelete(id);
  }
}
