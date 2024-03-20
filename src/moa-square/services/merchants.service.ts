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
import { FindOptionsRelations, Repository } from 'typeorm';
import { RestfulEntityRepositoryService } from '../../database/restful-entity-repository-service.js';
import { MerchantEntity } from '../entities/merchant.entity.js';

@Injectable()
export class MerchantsService extends RestfulEntityRepositoryService<MerchantEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(MerchantEntity)
    protected readonly repository: Repository<MerchantEntity>,
  ) {
    const logger = new Logger(MerchantsService.name);
    super(repository, logger);
    this.logger = logger;
  }

  async findOneByIdOrPath(params: {
    where: { idOrPath: string };
    relations?: FindOptionsRelations<MerchantEntity>;
  }) {
    return await this.findOne({
      where: [
        { id: params.where.idOrPath },
        { appConfig: { path: params.where.idOrPath } },
      ],
      relations: params.relations,
    });
  }
}
