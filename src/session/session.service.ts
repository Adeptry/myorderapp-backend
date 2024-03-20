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

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { RestfulEntityRepositoryService } from '../database/restful-entity-repository-service.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { SessionEntity } from './entities/session.entity.js';

@Injectable()
export class SessionService extends RestfulEntityRepositoryService<SessionEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(SessionEntity)
    protected readonly repository: Repository<SessionEntity>,
  ) {
    const logger = new Logger(SessionService.name);
    super(repository, logger);
    this.logger = logger;
  }

  async deleteExcluding({
    excludeId,
    ...criteria
  }: {
    id?: SessionEntity['id'];
    user?: Pick<UserEntity, 'id'>;
    excludeId?: SessionEntity['id'];
  }): Promise<void> {
    await this.repository.delete({
      ...criteria,
      id: criteria.id ? criteria.id : excludeId ? Not(excludeId) : undefined,
    });
  }
}
