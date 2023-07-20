import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogImage } from 'src/catalogs/entities/catalog-image.entity';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';

@Injectable()
export class CatalogImagesService extends BaseService<CatalogImage> {
  constructor(
    @InjectRepository(CatalogImage)
    protected readonly repository: Repository<CatalogImage>,
  ) {
    super(repository);
  }
}
