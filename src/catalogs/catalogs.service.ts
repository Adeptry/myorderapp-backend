import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LocationsService } from '../locations/locations.service.js';
import { AppLogger } from '../logger/app.logger.js';
import { SquareCatalogObjectTypeEnum } from '../square/square-catalog-object-type.enum.js';
import { SquareService } from '../square/square.service.js';
import { EntityRepositoryService } from '../utils/entity-repository-service.js';
import { CatalogImage } from './entities/catalog-image.entity.js';
import { Catalog } from './entities/catalog.entity.js';
import { Category } from './entities/category.entity.js';
import { ItemModifierList } from './entities/item-modifier-list.entity.js';
import { Item } from './entities/item.entity.js';
import { ModifierList } from './entities/modifier-list.entity.js';
import { Modifier } from './entities/modifier.entity.js';
import { Variation } from './entities/variation.entity.js';
import { CatalogImagesService } from './services/catalog-images.service.js';
import { CategoriesService } from './services/categories.service.js';
import { ItemModifierListService } from './services/item-modifier-list.service.js';
import { ItemsService } from './services/items.service.js';
import { ModifierListsService } from './services/modifier-lists.service.js';
import { ModifiersService } from './services/modifiers.service.js';
import { VariationsService } from './services/variations.service.js';

@Injectable()
export class CatalogsService extends EntityRepositoryService<Catalog> {
  constructor(
    @InjectRepository(Catalog)
    protected readonly repository: Repository<Catalog>,
    @InjectDataSource()
    private dataSource: DataSource,
    private readonly itemsService: ItemsService,
    private readonly variationsService: VariationsService,
    private readonly modifiersService: ModifiersService,
    private readonly modifierListsService: ModifierListsService,
    private readonly categoriesService: CategoriesService,
    private readonly catalogImagesService: CatalogImagesService,
    private readonly itemModifierListService: ItemModifierListService,
    @Inject(SquareService)
    private readonly squareService: SquareService,
    @Inject(LocationsService)
    private readonly locationsService: LocationsService,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(CatalogImagesService.name);
    super(repository, logger);
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
      const moaLocations = await this.locationsService.findBy({ merchantId });

      if (moaCatalog.id == null) {
        throw new Error('Catalog id is null.');
      }

      // Variations

      const squareItemVariationCatalogObjects =
        (await this.squareService.accumulateCatalog({
          accessToken,
          types: [SquareCatalogObjectTypeEnum.itemVariation],
        })) ?? [];
      const moaVariations = await this.loadManyRelation<Variation>(
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
        (await this.squareService.accumulateCatalog({
          accessToken,
          types: [SquareCatalogObjectTypeEnum.modifierList],
        })) ?? [];
      let moaModifierLists = await this.loadManyRelation<ModifierList>(
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
        (await this.squareService.accumulateCatalog({
          accessToken,
          types: [SquareCatalogObjectTypeEnum.modifier],
        })) ?? [];
      let moaModifiers = await this.loadManyRelation<Modifier>(
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
          moaCatalogId: moaCatalog.id,
          moaLocations,
        });
      }

      // Categories

      const squareCategoryCatalogObjects =
        (await this.squareService.accumulateCatalog({
          accessToken,
          types: [SquareCatalogObjectTypeEnum.category],
        })) ?? [];
      let moaCategories = await this.loadManyRelation<Category>(
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
        (await this.squareService.accumulateCatalog({
          accessToken,
          types: [SquareCatalogObjectTypeEnum.item],
        })) ?? [];
      let moaItems = await this.loadManyRelation<Item>(moaCatalog, 'items');
      this.logger.debug(`Found ${moaItems.length} items.`);
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

      // Catalog images
      const squareImages =
        (await this.squareService.accumulateCatalog({
          accessToken,
          types: [SquareCatalogObjectTypeEnum.image],
        })) ?? [];

      for (const [
        squareItemCatalogObjectIndex,
        squareItemCatalogObject,
      ] of squareItemCatalogObjects.entries()) {
        const squareItemData = squareItemCatalogObject.itemData;
        if (!squareItemData || !squareItemData.categoryId) {
          continue;
        }

        this.logger.debug(
          `Processing item ${squareItemCatalogObject.itemData?.name} ${squareItemCatalogObjectIndex}.`,
        );

        const moaCategory = await this.categoriesService.findOne({
          where: {
            squareId: squareItemData.categoryId,
            catalogId: moaCatalog.id,
          },
        });

        if (!moaCategory) {
          throw new Error(`No category for ${squareItemData.categoryId}.`);
        }

        let moaItem = await this.itemsService.findOne({
          where: {
            squareId: squareItemCatalogObject.id,
            catalogId: moaCatalog.id,
          },
        });
        if (moaItem == null) {
          moaItem = this.itemsService.create({
            squareId: squareItemCatalogObject.id,
            categoryId: moaCategory.id,
            catalogId: moaCatalog.id,
            presentAtAllLocations:
              squareItemCatalogObject.presentAtAllLocations,
          });
          moaItem.moaOrdinal = squareItemCatalogObjectIndex;
        }

        moaItem.name = squareItemData.name;
        moaItem.description = squareItemData.description;
        moaItem.category = moaCategory;

        moaItem = await this.itemsService.save(moaItem);

        if (moaItem.id == null) {
          throw new Error(`Item id is null.`);
        }

        const itemModifierLists =
          await this.itemsService.loadManyRelation<ItemModifierList>(
            moaItem,
            'itemModifierLists',
          );
        for (const moaItemModifierList of itemModifierLists ?? []) {
          await this.itemModifierListService.remove(moaItemModifierList);
        }

        for (const squareItemModifierListInfo of squareItemData.modifierListInfo ??
          []) {
          await this.itemModifierListService.process({
            squareItemModifierListInfo: squareItemModifierListInfo,
            moaItemId: moaItem.id,
            catalogId: moaCatalog.id,
          });
        }

        moaItem.presentAtAllLocations =
          squareItemCatalogObject.presentAtAllLocations;
        const itemPresentAtSquareLocationsIds =
          squareItemCatalogObject.presentAtLocationIds ?? [];
        if (itemPresentAtSquareLocationsIds.length > 0) {
          moaItem.presentAtLocations = moaLocations.filter((value) => {
            return (
              value.locationSquareId &&
              itemPresentAtSquareLocationsIds.includes(value.locationSquareId)
            );
          });
        } else {
          moaItem.presentAtLocations = [];
        }

        const itemAbsentAtSquareLocationsIds =
          squareItemCatalogObject.absentAtLocationIds ?? [];
        if (itemAbsentAtSquareLocationsIds.length > 0) {
          moaItem.absentAtLocations = moaLocations.filter((value) => {
            return (
              value.locationSquareId &&
              itemAbsentAtSquareLocationsIds.includes(value.locationSquareId)
            );
          });
        } else {
          moaItem.absentAtLocations = [];
        }

        if (squareItemData.imageIds && squareItemData.imageIds.length > 0) {
          for (const squareImageId of squareItemData.imageIds) {
            let catalogImage = await this.catalogImagesService.findOne({
              where: { squareId: squareImageId, catalogId: moaCatalog.id },
            });

            const squareImageForItem = squareImages.find(
              (value) => value.id === squareImageId,
            );

            if (!catalogImage) {
              catalogImage = this.catalogImagesService.create({
                item: moaItem,
                squareId: squareImageId,
                name: squareImageForItem?.imageData?.name,
                url: squareImageForItem?.imageData?.url,
                caption: squareImageForItem?.imageData?.caption,
              });
            } else {
              catalogImage.squareId = squareImageId;
              catalogImage.name = squareImageForItem?.imageData?.name;
              catalogImage.url = squareImageForItem?.imageData?.url;
              catalogImage.caption = squareImageForItem?.imageData?.caption;
              catalogImage.item = moaItem; // Associate the image to the item
            }
            // Save changes to the image
            catalogImage.catalogId = moaCatalog.id;
            await this.catalogImagesService.save(catalogImage);
          }
        } else {
          await this.catalogImagesService.removeAll(
            await this.itemsService.loadManyRelation<CatalogImage>(
              moaItem,
              'images',
            ),
          );
        }

        moaItem = await this.itemsService.save(moaItem);

        if (moaItem.id == null) {
          throw new Error('Item id is null.');
        }

        for (const squareItemDataVariation of squareItemData.variations ?? []) {
          const squareVariationCatalogObject =
            squareItemVariationCatalogObjects.find((value) => {
              return value.id === squareItemDataVariation.id;
            });

          if (squareVariationCatalogObject == null) {
            throw new Error(`No variation for ${squareItemDataVariation.id}.`);
          }

          await this.variationsService.process({
            squareCatalogObject: squareVariationCatalogObject,
            moaCatalogId: moaCatalog.id,
            moaLocations: moaLocations,
            moaItemId: moaItem.id,
          });
        }
      }
    });

    return moaCatalog;
  }
}
