import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogObject } from 'square';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { CatalogImageEntity } from '../entities/catalog-image.entity.js';

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

  /*
  {
      "type": "IMAGE",
      "id": "WQBQ4ZECK4GWJBUYR7ODG3QO",
      "updated_at": "2021-11-23T15:53:54.632Z",
      "created_at": "2020-11-21T20:30:40.609Z",
      "version": 1637682834632,
      "is_deleted": false,
      "present_at_all_locations": true,
      "image_data": {
        "url": "https://square-catalog-sandbox.s3.amazonaws.com/files/81729fda0d76f997c00e1bac0246973830f2e630/original.jpeg"
      }
    },
  */
  async squareSyncOrFail(params: {
    catalogImage: CatalogObject;
    catalogId: string;
  }) {
    this.logger.verbose(this.squareSyncOrFail.name);
    const { catalogImage, catalogId } = params;

    let image = await this.findOne({
      where: { catalogId, squareId: catalogImage.id },
    });

    if (!image) {
      image = this.create({
        squareId: catalogImage.id,
        name: catalogImage?.imageData?.name,
        url: catalogImage?.imageData?.url,
        caption: catalogImage?.imageData?.caption,
        synced: true,
        catalogId,
      });
    } else {
      image.name = catalogImage?.imageData?.name;
      image.url = catalogImage?.imageData?.url;
      image.caption = catalogImage?.imageData?.caption;
      image.synced = true;
    }

    this.logger.verbose(`returning image`);
    return await this.save(image);
  }
}
