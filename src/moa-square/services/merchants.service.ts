import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';
import { RestfulEntityRepositoryService } from '../../utils/restful-entity-repository-service.js';
import { MerchantEntity } from '../entities/merchants/merchant.entity.js';

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
