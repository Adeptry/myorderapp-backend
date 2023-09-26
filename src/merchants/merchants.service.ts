import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';
import { Merchant } from '../merchants/entities/merchant.entity.js';
import { RestfulEntityRepositoryService } from '../utils/restful-entity-repository-service.js';

@Injectable()
export class MerchantsService extends RestfulEntityRepositoryService<Merchant> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(Merchant)
    protected readonly repository: Repository<Merchant>,
  ) {
    const logger = new Logger(MerchantsService.name);
    super(repository, logger);
    this.logger = logger;
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
