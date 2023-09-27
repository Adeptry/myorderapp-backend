import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../../utils/entity-repository-service.js';
import { CatalogImageEntity } from '../../entities/catalogs/catalog-image.entity.js';

@Injectable()
export class CatalogImagesService extends EntityRepositoryService<CatalogImageEntity> {
  protected readonly logger: Logger;
  constructor(
    @InjectRepository(CatalogImageEntity)
    protected readonly repository: Repository<CatalogImageEntity>,
  ) {
    const logger = new Logger(CatalogImagesService.name);
    super(repository, logger);
    this.logger = logger;
  }
}
