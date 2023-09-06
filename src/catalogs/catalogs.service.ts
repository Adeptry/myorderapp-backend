import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { LocationsService } from 'src/locations/locations.service';
import { SquareCatalogObjectTypeEnum } from 'src/square/square-catalog-object-type.enum';
import { SquareService } from 'src/square/square.service';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { DataSource, Repository } from 'typeorm';
import { CatalogImage } from './entities/catalog-image.entity';
import { Catalog } from './entities/catalog.entity';
import { Category } from './entities/category.entity';
import { ItemModifierList } from './entities/item-modifier-list.entity';
import { Item } from './entities/item.entity';
import { ModifierList } from './entities/modifier-list.entity';
import { Modifier } from './entities/modifier.entity';
import { Variation } from './entities/variation.entity';
import { CatalogImagesService } from './services/catalog-images.service';
import { CategoriesService } from './services/categories.service';
import { ItemModifierListService } from './services/item-modifier-list.service';
import { ItemsService } from './services/items.service';
import { ModifierListsService } from './services/modifier-lists.service';
import { ModifiersService } from './services/modifiers.service';
import { VariationsService } from './services/variations.service';

@Injectable()
export class CatalogsService extends EntityRepositoryService<Catalog> {
  private readonly logger = new Logger(CatalogsService.name);

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
  ) {
    super(repository);
  }

  async squareSync(params: {
    squareAccessToken: string;
    catalogId: string;
    merchantId: string;
  }) {
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
      this.logger.verbose(`Deleted ${deletedMoaVariations.length} variations.`);

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
      this.logger.verbose(`Found ${moaModifierLists.length} modifier lists.`);
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
      this.logger.verbose(
        `Deleted ${deletedMoaModifierLists.length} modifier lists.`,
      );

      for (const squareModifierList of squareModifierListCatalogObjects) {
        await this.modifierListsService.processAndSave({
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
      this.logger.verbose(`Deleted ${deletedMoaModifiers.length} modifiers.`);

      for (const squareModifier of squareModifierCatalogObjects) {
        await this.modifiersService.processAndSave({
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
      this.logger.verbose(`Deleted ${deletedMoaCategories.length} categories.`);

      for (const [
        squareCategoryIndex,
        squareCategoryCatalogObject,
      ] of squareCategoryCatalogObjects.entries()) {
        await this.categoriesService.processAndSave({
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
      this.logger.verbose(`Found ${moaItems.length} items.`);
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
      this.logger.verbose(`Deleted ${deletedMoaItems.length} items.`);

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

        this.logger.verbose(
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
          await this.itemModifierListService.processAndSave({
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

          await this.variationsService.processAndSave({
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

// const moaItemModifierListsForItem =
//   await this.itemsService.loadManyRelation<ItemModifierList>(
//     moaItem,
//     'itemModifierLists',
//   );

// const squareModifierListInfosForItem =
//   squareItemForCategory.itemData?.modifierListInfo ?? []; // TODO THIS INFORMATION IS _UNIQUE_ TO ITEM

// TODO delete modifier lists that are no longer present

// for (const squareModifierListInfoForItem of squareModifierListInfosForItem) {
// const squareModifierList = squareModifierLists.find((value) => {
//   return value.id === squareModifierListInfoForItem.modifierListId;
// });
// const squareModifierListData = squareModifierList?.modifierListData;

// let moaModifierList =
//   moaModifierLists.find((value) => {
//     return (
//       value.squareId ===
//       squareModifierListInfoForItem.modifierListId
//     );
//   }) ??
//   (await this.modifierListsService.findOne({
//     where: {
//       squareId: squareModifierListInfoForItem.modifierListId,
//       catalogId: moaCatalog.id,
//     },
//   }));

// if (moaModifierList == null) {
//   moaModifierList = this.modifierListsService.create({
//     squareId: squareModifierListInfoForItem.modifierListId,
//     catalogId: moaCatalog.id,
//   });
//   this.logger.verbose(
//     `Created modifier list ${moaModifierList.name} ${moaModifierList.id}.`,
//   );
// }

// if (
//   !moaItem.modifierLists?.some((value) => {
//     return value.id === moaModifierList?.id;
//   })
// ) {
//   moaItem.modifierLists?.push(moaModifierList);
//   await this.itemsService.save(moaItem);
//   this.logger.verbose(
//     `Added ${moaModifierList.name} ${moaModifierList.id} to item ${moaItem.name} ${moaItem.id}.`,
//   );
// }

// TODO THIS IS INCORRECT
// moaModifierList.maxSelectedModifiers =
//   squareModifierListInfoForItem.maxSelectedModifiers;
// moaModifierList.minSelectedModifiers =
//   squareModifierListInfoForItem.minSelectedModifiers;
// moaModifierList.enabled = squareModifierListInfoForItem.enabled;
// moaModifierList.name = squareModifierListData?.name;
// moaModifierList.selectionType =
//   (squareModifierList?.modifierListData
//     ?.selectionType as MoaSelectionType) ??
//   MoaSelectionType.MULTIPLE;

// moaModifierList = await this.modifierListsService.save(
//   moaModifierList,
// );

// if (moaModifierList.id == null) {
//   throw new Error('Modifier list id is null.');
// }

// }
