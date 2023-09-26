import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogImage } from '../../catalogs/entities/catalog-image.entity.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';

@Injectable()
export class CatalogImagesService extends EntityRepositoryService<CatalogImage> {
  protected readonly logger: Logger;
  constructor(
    @InjectRepository(CatalogImage)
    protected readonly repository: Repository<CatalogImage>,
  ) {
    const logger = new Logger(CatalogImagesService.name);
    super(repository, logger);
    this.logger = logger;
  }
}
