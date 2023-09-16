import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogImage } from '../../catalogs/entities/catalog-image.entity.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';

@Injectable()
export class CatalogImagesService extends EntityRepositoryService<CatalogImage> {
  constructor(
    @InjectRepository(CatalogImage)
    protected readonly repository: Repository<CatalogImage>,
  ) {
    super(repository);
  }
}
