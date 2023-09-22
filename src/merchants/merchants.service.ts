import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';
import { AppLogger } from '../logger/app.logger.js';
import { Merchant } from '../merchants/entities/merchant.entity.js';
import { RestfulEntityRepositoryService } from '../utils/restful-entity-repository-service.js';

@Injectable()
export class MerchantsService extends RestfulEntityRepositoryService<Merchant> {
  constructor(
    @InjectRepository(Merchant)
    protected readonly repository: Repository<Merchant>,

    protected readonly logger: AppLogger,
  ) {
    logger.setContext(MerchantsService.name);
    super(repository, logger);
  }

  async findOneByIdOrPath(params: {
    where: { idOrPath: string };
    relations?: FindOptionsRelations<Merchant>;
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
