import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  NestSquareCatalogObjectTypeEnum,
  NestSquareService,
} from 'nest-square';
import { DataSource, Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { CatalogEntity } from '../entities/catalog.entity.js';
import { CategoryEntity } from '../entities/category.entity.js';
import { ItemEntity } from '../entities/item.entity.js';
import { ModifierListEntity } from '../entities/modifier-list.entity.js';
import { ModifierEntity } from '../entities/modifier.entity.js';
import { VariationEntity } from '../entities/variation.entity.js';
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
    @InjectDataSource()
    private dataSource: DataSource,
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

  async squareSync2(params: {
    squareAccessToken: string;
    catalogId: string;
    merchantId: string;
  }) {
    this.logger.verbose(this.squareSync2.name);
    const { merchantId, catalogId, squareAccessToken: accessToken } = params;
    const moaCatalog = await this.findOneOrFail({
      where: { id: catalogId },
    });

    await this.itemsService.delete({ catalogId: moaCatalog.id });
    await this.variationsService.delete({ catalogId: moaCatalog.id });
    await this.modifierListsService.delete({ catalogId: moaCatalog.id });
    await this.categoriesService.delete({ catalogId: moaCatalog.id });
    await this.catalogImagesService.delete({ catalogId: moaCatalog.id });

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
        await this.modifierListsService.process({
          catalogObject: modifierList,
          moaCatalogId: catalogId,
        });
      }
      modifierListCursor = response.result.cursor;
    }

    let modifierCursor: string | undefined | null = null;
    while (modifierCursor !== undefined) {
      const response = await this.squareService.retryOrThrow(
        accessToken,
        async (client) => {
          return await client.catalogApi.listCatalog(
            modifierCursor ?? undefined,
            'MODIFIER',
          );
        },
      );
      for (const squareModifier of response.result.objects ?? []) {
        await this.modifiersService.process({
          squareCatalogObject: squareModifier,
          catalogId,
          merchantId,
        });
      }
      modifierCursor = response.result.cursor;
    }

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
        await this.categoriesService.process({
          squareCategoryCatalogObject: category,
          moaCatalogId: catalogId,
          moaOrdinal: squareCategoryIndex,
        });
        squareCategoryIndex++;
      }
      categoriesCursor = response.result.cursor;
    }

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
        await this.catalogImagesService.process({
          catalogImage: category,
          catalogId: catalogId,
        });
      }
      catalogImagesCursor = response.result.cursor;
    }

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
        await this.itemsService.process({
          merchantId,
          squareItemCatalogObject: item,
          catalogId: catalogId,
          moaOrdinal: index,
        });
        index++;
      }
      itemsCursor = response.result.cursor;
    }

    this.logger.verbose(`Finished syncing catalog ${moaCatalog.id}.`);
  }

  async squareSync(params: {
    squareAccessToken: string;
    catalogId: string;
    merchantId: string;
  }) {
    this.logger.verbose(this.squareSync.name);
    const { merchantId, catalogId, squareAccessToken: accessToken } = params;
    const moaCatalog = await this.findOneOrFail({
      where: { id: catalogId },
    });

    await this.dataSource.transaction(async () => {
      if (moaCatalog.id == null) {
        throw new Error('Catalog id is null.');
      }

      // Variations

      const squareItemVariationCatalogObjects =
        (await this.squareService.accumulateCatalogOrThrow({
          accessToken,
          types: [NestSquareCatalogObjectTypeEnum.itemVariation],
        })) ?? [];
      const moaVariations = await this.loadManyRelation<VariationEntity>(
        moaCatalog,
        'variations',
      );
      const deletedMoaVariations = moaVariations.filter((moaValue) => {
        return !squareItemVariationCatalogObjects.some((squareValue) => {
          return squareValue.id === moaValue.squareId;
        });
      });
      await this.variationsService.removeAll(deletedMoaVariations);
      this.logger.debug(`Deleted ${deletedMoaVariations.length} variations.`);

      // Modifiers lists

      const squareModifierListCatalogObjects =
        (await this.squareService.accumulateCatalogOrThrow({
          accessToken,
          types: [NestSquareCatalogObjectTypeEnum.modifierList],
        })) ?? [];
      let moaModifierLists = await this.loadManyRelation<ModifierListEntity>(
        moaCatalog,
        'modifierLists',
      );
      this.logger.debug(`Found ${moaModifierLists.length} modifier lists.`);
      const deletedMoaModifierLists = moaModifierLists.filter((moaValue) => {
        return !squareModifierListCatalogObjects.some((squareValue) => {
          return squareValue.id === moaValue.squareId;
        });
      });
      await this.modifierListsService.removeAll(deletedMoaModifierLists);
      moaModifierLists = moaModifierLists.filter((moaValue) => {
        return !deletedMoaModifierLists.some((deletedValue) => {
          return deletedValue.squareId === moaValue.squareId;
        });
      });
      this.logger.debug(
        `Deleted ${deletedMoaModifierLists.length} modifier lists.`,
      );

      for (const squareModifierList of squareModifierListCatalogObjects) {
        await this.modifierListsService.process({
          catalogObject: squareModifierList,
          moaCatalogId: moaCatalog.id,
        });
      }

      // Modifiers

      const squareModifierCatalogObjects =
        (await this.squareService.accumulateCatalogOrThrow({
          accessToken,
          types: [NestSquareCatalogObjectTypeEnum.modifier],
        })) ?? [];
      let moaModifiers = await this.loadManyRelation<ModifierEntity>(
        moaCatalog,
        'modifiers',
      );
      const deletedMoaModifiers = moaModifiers.filter((moaValue) => {
        return !squareModifierCatalogObjects.some((squareValue) => {
          return squareValue.id === moaValue.squareId;
        });
      });
      await this.modifiersService.removeAll(deletedMoaModifiers);
      moaModifiers = moaModifiers.filter((moaValue) => {
        return !deletedMoaModifiers.some((deletedValue) => {
          return deletedValue.squareId === moaValue.squareId;
        });
      });
      this.logger.debug(`Deleted ${deletedMoaModifiers.length} modifiers.`);

      for (const squareModifier of squareModifierCatalogObjects) {
        await this.modifiersService.process({
          squareCatalogObject: squareModifier,
          catalogId: moaCatalog.id,
          merchantId,
        });
      }

      // Categories

      const squareCategoryCatalogObjects =
        (await this.squareService.accumulateCatalogOrThrow({
          accessToken,
          types: [NestSquareCatalogObjectTypeEnum.category],
        })) ?? [];
      let moaCategories = await this.loadManyRelation<CategoryEntity>(
        moaCatalog,
        'categories',
      );
      const deletedMoaCategories = moaCategories.filter((moaValue) => {
        return !squareCategoryCatalogObjects.some((squareValue) => {
          return squareValue.id === moaValue.squareId;
        });
      });
      await this.categoriesService.removeAll(deletedMoaCategories);
      moaCategories = moaCategories.filter((moaValue) => {
        return !deletedMoaCategories.some((deletedValue) => {
          return deletedValue.squareId === moaValue.squareId;
        });
      });
      this.logger.debug(`Deleted ${deletedMoaCategories.length} categories.`);

      for (const [
        squareCategoryIndex,
        squareCategoryCatalogObject,
      ] of squareCategoryCatalogObjects.entries()) {
        await this.categoriesService.process({
          squareCategoryCatalogObject: squareCategoryCatalogObject,
          moaCatalogId: moaCatalog.id,
          moaOrdinal: squareCategoryIndex,
        });
      }

      // Items

      const squareItemCatalogObjects =
        (await this.squareService.accumulateCatalogOrThrow({
          accessToken,
          types: [NestSquareCatalogObjectTypeEnum.item],
        })) ?? [];
      this.logger.debug(
        `Found ${squareItemCatalogObjects.length} remote items.`,
      );
      let moaItems = await this.loadManyRelation<ItemEntity>(
        moaCatalog,
        'items',
      );
      this.logger.debug(`Found ${moaItems.length} local items.`);
      const deletedMoaItems = moaItems.filter((moaValue) => {
        return !squareItemCatalogObjects.some((squareValue) => {
          return squareValue.id === moaValue.squareId;
        });
      });
      await this.itemsService.removeAll(deletedMoaItems);
      moaItems = moaItems.filter((moaValue) => {
        return !deletedMoaItems.some((deletedValue) => {
          return deletedValue.squareId === moaValue.squareId;
        });
      });
      this.logger.debug(`Deleted ${deletedMoaItems.length} items.`);

      await this.catalogImagesService.delete({ catalogId: moaCatalog.id });
      const squareImages =
        (await this.squareService.accumulateCatalogOrThrow({
          accessToken,
          types: [NestSquareCatalogObjectTypeEnum.image],
        })) ?? [];
      for (const squareImage of squareImages) {
        await this.catalogImagesService.process({
          catalogImage: squareImage,
          catalogId: moaCatalog.id,
        });
      }

      for (const [
        squareItemCatalogObjectIndex,
        squareItemCatalogObject,
      ] of squareItemCatalogObjects.entries()) {
        await this.itemsService.process({
          merchantId,
          squareItemCatalogObject,
          catalogId: moaCatalog.id,
          moaOrdinal: squareItemCatalogObjectIndex,
        });
      }
    });

    return moaCatalog;
  }
}
