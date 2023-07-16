import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { CatalogImage } from '../entities/catalog-image.entity';

@Injectable()
export class CatalogImagesService extends BaseService<CatalogImage> {
  constructor(
    @InjectRepository(CatalogImage)
    protected readonly repository: Repository<CatalogImage>,
  ) {
    super(repository);
  }
}
