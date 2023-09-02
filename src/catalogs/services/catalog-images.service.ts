import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogImage } from 'src/catalogs/entities/catalog-image.entity';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { Repository } from 'typeorm';

@Injectable()
export class CatalogImagesService extends EntityRepositoryService<CatalogImage> {
  constructor(
    @InjectRepository(CatalogImage)
    protected readonly repository: Repository<CatalogImage>,
  ) {
    super(repository);
  }
}
