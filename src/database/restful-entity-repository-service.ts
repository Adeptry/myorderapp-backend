/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

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
