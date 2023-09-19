import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogImage } from '../../catalogs/entities/catalog-image.entity.js';
import { AppLogger } from '../../logger/app.logger.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';

@Injectable()
export class CatalogImagesService extends EntityRepositoryService<CatalogImage> {
  constructor(
    @InjectRepository(CatalogImage)
    protected readonly repository: Repository<CatalogImage>,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(CatalogImagesService.name);
    super(repository, logger);
  }
}
