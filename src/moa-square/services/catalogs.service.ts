/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NestSquareService } from 'nest-square';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { CatalogEntity } from '../entities/catalog.entity.js';
import { CatalogImagesService } from './catalog-images.service.js';
import { CategoriesService } from './categories.service.js';
import { ItemsService } from './items.service.js';
import { ModifierListsService } from './modifier-lists.service.js';
import { ModifiersService } from './modifiers.service.js';
import { VariationsService } from './variations.service.js';

@Injectable()
export class CatalogsService extends EntityRepositoryService<CatalogEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(CatalogEntity)
    protected readonly repository: Repository<CatalogEntity>,
    private readonly itemsService: ItemsService,
    private readonly variationsService: VariationsService,
    private readonly modifiersService: ModifiersService,
    private readonly modifierListsService: ModifierListsService,
    private readonly categoriesService: CategoriesService,
    private readonly catalogImagesService: CatalogImagesService,
    private readonly squareService: NestSquareService,
  ) {
    const logger = new Logger(CatalogsService.name);
    super(repository, logger);
    this.logger = logger;
  }

  async squareSyncOrFail(params: {
    squareAccessToken: string;
    catalogId: string;
    merchantId: string;
  }) {
    this.logger.verbose(this.squareSyncOrFail.name);
    const { merchantId, catalogId, squareAccessToken: accessToken } = params;

    const moaCatalog = await this.findOneOrFail({
      where: { id: catalogId },
    });

    await this.modifiersService.update(
      { catalogId: moaCatalog.id },
      { synced: false },
    );
    await this.modifierListsService.update(
      { catalogId: moaCatalog.id },
      { synced: false },
    );
    let modifierListCursor: string | undefined | null = null;
    while (modifierListCursor !== undefined) {
      const response = await this.squareService.retryOrThrow(
        accessToken,
        async (client) => {
          return await client.catalogApi.listCatalog(
            modifierListCursor ?? undefined,
            'MODIFIER_LIST',
          );
        },
      );
      for (const modifierList of response.result.objects ?? []) {
        try {
          await this.modifierListsService.squareSyncOrFail({
            catalogObject: modifierList,
            catalogId: catalogId,
            merchantId: merchantId,
          });
        } catch (error) {
          this.logger.error(error);
        }
      }
      modifierListCursor = response.result.cursor;
    }
    await this.modifiersService.delete({
      catalogId: moaCatalog.id,
      synced: false,
    });
    await this.modifierListsService.delete({
      catalogId: moaCatalog.id,
      synced: false,
    });

    await this.categoriesService.update(
      { catalogId: moaCatalog.id },
      { synced: false },
    );
    let categoriesCursor: string | undefined | null = null;
    while (categoriesCursor !== undefined) {
      const response = await this.squareService.retryOrThrow(
        accessToken,
        async (client) => {
          return await client.catalogApi.listCatalog(
            categoriesCursor ?? undefined,
            'CATEGORY',
          );
        },
      );
      let squareCategoryIndex = 0;
      for (const category of response.result.objects ?? []) {
        try {
          await this.categoriesService.squareSyncOrFail({
            squareCategoryCatalogObject: category,
            moaCatalogId: catalogId,
            moaOrdinal: squareCategoryIndex,
          });
        } catch (error) {
          this.logger.error(error);
        }

        squareCategoryIndex++;
      }
      categoriesCursor = response.result.cursor;
    }
    await this.categoriesService.delete({
      catalogId: moaCatalog.id,
      synced: false,
    });

    await this.catalogImagesService.update(
      { catalogId: moaCatalog.id },
      { synced: false },
    );
    let catalogImagesCursor: string | undefined | null = null;
    while (catalogImagesCursor !== undefined) {
      const response = await this.squareService.retryOrThrow(
        accessToken,
        async (client) => {
          return await client.catalogApi.listCatalog(
            catalogImagesCursor ?? undefined,
            'IMAGE',
          );
        },
      );
      for (const category of response.result.objects ?? []) {
        try {
          await this.catalogImagesService.squareSyncOrFail({
            catalogImage: category,
            catalogId: catalogId,
          });
        } catch (error) {
          this.logger.error(error);
        }
      }
      catalogImagesCursor = response.result.cursor;
    }
    await this.catalogImagesService.delete({
      catalogId: moaCatalog.id,
      synced: false,
    });

    await this.itemsService.update(
      { catalogId: moaCatalog.id },
      { synced: false },
    );
    await this.variationsService.update(
      { catalogId: moaCatalog.id },
      { synced: false },
    );
    let itemsCursor: string | undefined | null = null;
    while (itemsCursor !== undefined) {
      const response = await this.squareService.retryOrThrow(
        accessToken,
        async (client) => {
          return await client.catalogApi.listCatalog(
            itemsCursor ?? undefined,
            'ITEM',
          );
        },
      );
      let index = 0;
      for (const item of response.result.objects ?? []) {
        try {
          await this.itemsService.squareSyncOrFail({
            merchantId,
            squareItemCatalogObject: item,
            catalogId: catalogId,
            moaOrdinal: index,
          });
        } catch (error) {
          this.logger.error(error);
        }

        index++;
      }
      itemsCursor = response.result.cursor;
    }
    await this.itemsService.delete({
      catalogId: moaCatalog.id,
      synced: false,
    });
    await this.variationsService.delete({
      catalogId: moaCatalog.id,
      synced: false,
    });

    this.logger.verbose(`Finished syncing catalog ${moaCatalog.id}.`);
  }
}
