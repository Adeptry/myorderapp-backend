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
import { Repository } from 'typeorm';
import { RestfulEntityRepositoryService } from '../database/restful-entity-repository-service.js';
import { CustomerEntity } from '../moa-square/entities/customer.entity.js';
import { MerchantEntity } from '../moa-square/entities/merchant.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { RoleEnum } from './roles.enum.js';

@Injectable()
export class UsersService extends RestfulEntityRepositoryService<UserEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(UserEntity)
    protected readonly repository: Repository<UserEntity>,
  ) {
    const logger = new Logger(UsersService.name);
    super(repository, logger);
    this.logger = logger;
  }

  findAdmins(): Promise<UserEntity[]> {
    return this.find({ where: { role: { id: RoleEnum.admin } } });
  }

  async removeIfUnrelated(entity: UserEntity) {
    this.logger.verbose(this.removeIfUnrelated.name, entity.id);
    const customers = await this.loadManyRelation<CustomerEntity>(
      entity,
      'customers',
    );
    const merchants = await this.loadManyRelation<MerchantEntity>(
      entity,
      'merchants',
    );

    if (customers.length === 0 && merchants.length === 0) {
      return this.remove(entity);
    } else {
      this.logger.verbose("Can't remove user", entity.id);
      return undefined;
    }
  }
}
