import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { LocationsService } from 'src/locations/locations.service';
import { SquareService } from 'src/square/square.service';
import { BaseService } from 'src/utils/base-service';
import { DataSource, Repository } from 'typeorm';
import { MoaSelectionType } from './dto/catalogs.types';
import { CatalogImage } from './entities/catalog-image.entity';
import { Catalog } from './entities/catalog.entity';
import { Category } from './entities/category.entity';
import { Item } from './entities/item.entity';
import { ModifierList } from './entities/modifier-list.entity';
import { ModifierLocationOverride } from './entities/modifier-location-override.entity';
import { Modifier } from './entities/modifier.entity';
import { VariationLocationOverride } from './entities/variation-location-override.entity';
import { Variation } from './entities/variation.entity';
import { CatalogImagesService } from './services/catalog-images.service';
import { CategoriesService } from './services/categories.service';
import { ItemsService } from './services/items.service';
import { ModifierListsService } from './services/modifier-lists.service';
import { ModifierLocationOverridesService } from './services/modifier-location-overrides.service';
import { ModifiersService } from './services/modifiers.service';
import { VariationLocationOverridesService } from './services/variation-location-overrides.service';
import { VariationsService } from './services/variations.service';

@Injectable()
export class CatalogsService extends BaseService<Catalog> {
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
    private readonly variationLocationOverridesService: VariationLocationOverridesService,
    private readonly modifierLocationOverridesService: ModifierLocationOverridesService,
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
      const squareCatalogObjects =
        (await this.squareService.listCatalog({
          accessToken,
        })) ?? [];
      const moaLocations = await this.locationsService.findBy({ merchantId });

      if (moaCatalog.id == null) {
        throw new Error('Catalog id is null.');
      }

      // Categories

      const squareCategories = squareCatalogObjects.filter((value) => {
        return value.type === 'CATEGORY';
      });
      let moaCategories = await this.loadManyRelation<Category>(
        moaCatalog,
        'categories',
      );
      const deletedMoaCategories = moaCategories.filter((moaValue) => {
        return !squareCategories.some((squareValue) => {
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

      // Items

      const squareItems = squareCatalogObjects.filter((value) => {
        return value.type === 'ITEM';
      });
      let moaItems = await this.loadManyRelation<Item>(moaCatalog, 'items');
      this.logger.verbose(`Found ${moaItems.length} items.`);
      const deletedMoaItems = moaItems.filter((moaValue) => {
        return !squareItems.some((squareValue) => {
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

      // Variations

      const squareItemVariations = squareCatalogObjects.filter((value) => {
        return value.type === 'ITEM_VARIATION';
      });
      const moaVariations = await this.loadManyRelation<Variation>(
        moaCatalog,
        'variations',
      );
      const deletedMoaVariations = moaVariations.filter((moaValue) => {
        return !squareItemVariations.some((squareValue) => {
          return squareValue.id === moaValue.squareId;
        });
      });
      await this.variationsService.removeAll(deletedMoaVariations);
      this.logger.verbose(`Deleted ${deletedMoaVariations.length} variations.`);

      // Modifiers lists

      const squareModifierLists = squareCatalogObjects.filter((value) => {
        return value.type === 'MODIFIER_LIST';
      });
      let moaModifierLists = await this.loadManyRelation<ModifierList>(
        moaCatalog,
        'modifierLists',
      );
      this.logger.verbose(`Found ${moaModifierLists.length} modifier lists.`);
      const deletedMoaModifierLists = moaModifierLists.filter((moaValue) => {
        return !squareModifierLists.some((squareValue) => {
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

      // Modifiers

      const squareModifiers = squareCatalogObjects.filter((value) => {
        return value.type === 'MODIFIER';
      });
      let moaModifiers = await this.loadManyRelation<Modifier>(
        moaCatalog,
        'modifiers',
      );
      const deletedMoaModifiers = moaModifiers.filter((moaValue) => {
        return !squareModifiers.some((squareValue) => {
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

      // Catalog images
      const squareImages = squareCatalogObjects.filter((value) => {
        return value.type === 'IMAGE';
      });

      // Main loop

      for (const [
        squareCategoryIndex,
        squareCategory,
      ] of squareCategories.entries()) {
        this.logger.verbose(
          `Processing category ${squareCategory.categoryData?.name} ${squareCategoryIndex}.`,
        );
        let moaCategory = moaCategories.find((value) => {
          return value.squareId === squareCategory.id;
        });

        if (moaCategory == null) {
          moaCategory = this.categoriesService.create({
            squareId: squareCategory.id,
            catalogId: moaCatalog.id,
          });
          moaCategory.moaOrdinal = squareCategoryIndex;
          this.logger.verbose(
            `Created category ${squareCategory.categoryData?.name}.`,
          );
        }

        moaCategory.name = squareCategory.categoryData?.name;
        await this.categoriesService.save(moaCategory);
        if (moaCategory.id == null) {
          throw new Error('Category id is null.');
        }

        const squareItemsForCategory = squareItems.filter((value) => {
          return value.itemData?.categoryId === squareCategory.id;
        });

        for (const [
          squareItemForCategoryIndex,
          squareItemForCategory,
        ] of squareItemsForCategory.entries()) {
          this.logger.verbose(
            `Processing item ${squareItemForCategory.itemData?.name} ${squareItemForCategoryIndex}.`,
          );
          let moaItem =
            moaItems.find((value) => {
              return value.squareId === squareItemForCategory.id;
            }) ??
            (await this.itemsService.findOne({
              where: { squareId: squareItemForCategory.id },
            }));
          if (moaItem == null) {
            moaItem = this.itemsService.create({
              squareId: squareItemForCategory.id,
              categoryId: moaCategory.id,
              catalogId: moaCatalog.id,
              presentAtAllLocations:
                squareItemForCategory.presentAtAllLocations,
            });
            moaItem.moaOrdinal = squareItemForCategoryIndex;
          }

          const squareItemData = squareItemForCategory.itemData;
          if (squareItemData == null) {
            continue;
          }

          moaItem.name = squareItemData.name;
          moaItem.description = squareItemData.description;
          moaItem.category = moaCategory;

          await this.itemsService.save(moaItem);

          moaItem.presentAtAllLocations =
            squareItemForCategory.presentAtAllLocations;
          const itemPresentAtSquareLocationsIds =
            squareItemForCategory.presentAtLocationIds ?? [];
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
            squareItemForCategory.absentAtLocationIds ?? [];
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
                where: { squareId: squareImageId },
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

          await this.itemsService.save(moaItem);

          if (moaItem.id == null) {
            throw new Error('Item id is null.');
          }

          for (const squareVariation of squareItemData.variations ?? []) {
            this.logger.verbose(
              `Processing variation ${squareVariation.itemVariationData?.name} ${squareVariation.id}.`,
            );
            let moaVariation =
              moaVariations.find((value) => {
                return value.squareId === squareVariation.id;
              }) ??
              (await this.variationsService.findOne({
                where: { squareId: squareVariation.id },
              }));

            if (moaVariation == null) {
              moaVariation = this.variationsService.create({
                squareId: squareVariation.id,
                itemId: moaItem.id,
                catalogId: moaCatalog.id,
              });
            }

            const squareVariationData = squareVariation.itemVariationData;
            if (squareVariationData == null) {
              continue;
            }

            moaVariation.name = squareVariationData.name;
            moaVariation.ordinal = squareVariationData.ordinal;
            moaVariation.priceInCents =
              Number(squareVariationData.priceMoney?.amount ?? 0) ?? 0;

            try {
              await this.variationsService.save(moaVariation);
            } catch (error) {
              this.logger.log(error);
            }

            const squareVariationLocationOverrides =
              squareVariationData.locationOverrides;

            if (squareVariationLocationOverrides) {
              // First, delete all existing VariationLocationOverrides for this moaVariation
              const existingVariationLocationOverrides =
                await this.variationLocationOverridesService.find({
                  where: {
                    variationId: moaVariation.id,
                  },
                });
              for (const existingOverride of existingVariationLocationOverrides) {
                await this.variationLocationOverridesService.remove(
                  existingOverride,
                );
              }

              // Then, recreate them based on the current Square data
              for (const override of squareVariationLocationOverrides) {
                const moaLocationForVariationOverride = moaLocations.find(
                  (value) => {
                    return value.locationSquareId === override.locationId;
                  },
                );

                const moaVariationLocationOverride =
                  new VariationLocationOverride();
                moaVariationLocationOverride.variationId = moaVariation.id;
                moaVariationLocationOverride.locationId =
                  moaLocationForVariationOverride?.id;
                moaVariationLocationOverride.amount = Number(
                  override.priceMoney?.amount ?? 0,
                );
                moaVariationLocationOverride.currency =
                  override.priceMoney?.currency;

                await this.variationLocationOverridesService.save(
                  moaVariationLocationOverride,
                );
              }
            }

            await this.variationsService.save(moaVariation);
          }

          const moaModifierListsForItem =
            await this.itemsService.loadModifierLists(moaItem);
          this.logger.verbose(
            `Found ${moaModifierListsForItem.length} modifier lists in db.`,
          );
          const squareModifierListInfosForItem =
            squareItemForCategory.itemData?.modifierListInfo ?? [];
          this.logger.verbose(
            `Found ${squareModifierListInfosForItem.length} modifier lists in Square.`,
          );
          this.logger.verbose(
            `${squareModifierListInfosForItem
              .flatMap((value) => value.modifierListId)
              .join(' ')}`,
          );
          const modifierListsRemovedFromItem = moaModifierListsForItem.filter(
            (moaValue) => {
              return !squareModifierListInfosForItem.some((squareValue) => {
                return squareValue.modifierListId === moaValue.squareId;
              });
            },
          );
          if (modifierListsRemovedFromItem.length > 0) {
            this.logger.verbose(
              `Removed ${modifierListsRemovedFromItem.length}.`,
            );
            moaItem.modifierLists = moaModifierListsForItem.filter(
              (moaValue) => {
                return !modifierListsRemovedFromItem.some((deletedValue) => {
                  return deletedValue.squareId === moaValue.squareId;
                });
              },
            );
            moaItem = await this.itemsService.save(moaItem);
          } else {
            moaItem.modifierLists = moaModifierListsForItem;
          }

          for (const squareModifierListInfoForItem of squareModifierListInfosForItem) {
            const squareModifierList = squareModifierLists.find((value) => {
              return value.id === squareModifierListInfoForItem.modifierListId;
            });
            const squareModifierListData = squareModifierList?.modifierListData;

            let moaModifierList =
              moaModifierLists.find((value) => {
                return (
                  value.squareId ===
                  squareModifierListInfoForItem.modifierListId
                );
              }) ??
              (await this.modifierListsService.findOne({
                where: {
                  squareId: squareModifierListInfoForItem.modifierListId,
                },
              }));

            if (moaModifierList == null) {
              moaModifierList = this.modifierListsService.create({
                squareId: squareModifierListInfoForItem.modifierListId,
                catalogId: moaCatalog.id,
              });
              this.logger.verbose(
                `Created modifier list ${moaModifierList.name} ${moaModifierList.id}.`,
              );
            }

            if (
              !moaItem.modifierLists?.some((value) => {
                return value.id === moaModifierList?.id;
              })
            ) {
              moaItem.modifierLists?.push(moaModifierList);
              await this.itemsService.save(moaItem);
              this.logger.verbose(
                `Added ${moaModifierList.name} ${moaModifierList.id} to item ${moaItem.name} ${moaItem.id}.`,
              );
            }

            moaModifierList.maxSelectedModifiers =
              squareModifierListInfoForItem.maxSelectedModifiers;
            moaModifierList.minSelectedModifiers =
              squareModifierListInfoForItem.minSelectedModifiers;
            moaModifierList.enabled = squareModifierListInfoForItem.enabled;
            moaModifierList.name = squareModifierListData?.name;
            moaModifierList.selectionType =
              (squareModifierList?.modifierListData
                ?.selectionType as MoaSelectionType) ??
              MoaSelectionType.MULTIPLE;

            moaModifierList = await this.modifierListsService.save(
              moaModifierList,
            );

            if (moaModifierList.id == null) {
              throw new Error('Modifier list id is null.');
            }

            for (const squareModifier of squareModifierListData?.modifiers ??
              []) {
              let moaModifier =
                moaModifiers.find((value) => {
                  return value.squareId === squareModifier.id;
                }) ??
                (await this.modifiersService.findOne({
                  where: { squareId: squareModifier.id },
                }));

              if (moaModifier == null) {
                moaModifier = this.modifiersService.create({
                  squareId: squareModifier.id,
                  modifierListId: moaModifierList.id,
                  catalogId: moaCatalog.id,
                });
                moaModifiers.push(moaModifier);
                this.logger.verbose(
                  `Created modifier ${moaModifier.name} ${moaModifier.id}.`,
                );
              }

              const squareModifierData = squareModifier.modifierData;
              moaModifier.modifierList = moaModifierList;
              moaModifier.name = squareModifierData?.name;
              moaModifier.ordinal = squareModifierData?.ordinal;
              moaModifier.priceInCents = Number(
                squareModifierData?.priceMoney?.amount ?? 0,
              );
              await this.modifiersService.save(moaModifier);

              moaModifier.presentAtAllLocations =
                squareModifier.presentAtAllLocations;
              const modifierPresentAtSquareLocationsIds =
                squareModifier.presentAtLocationIds ?? [];
              if (modifierPresentAtSquareLocationsIds.length > 0) {
                moaModifier.presentAtLocations = moaLocations.filter(
                  (value) => {
                    return (
                      value.locationSquareId &&
                      modifierPresentAtSquareLocationsIds.includes(
                        value.locationSquareId,
                      )
                    );
                  },
                );
              } else {
                moaModifier.presentAtLocations = [];
              }
              const modifierAbsentAtSquareLocationsIds =
                squareModifier.absentAtLocationIds ?? [];
              if (modifierAbsentAtSquareLocationsIds.length > 0) {
                moaModifier.absentAtLocations = moaLocations.filter((value) => {
                  return (
                    value.locationSquareId &&
                    modifierAbsentAtSquareLocationsIds.includes(
                      value.locationSquareId,
                    )
                  );
                });
              } else {
                moaModifier.absentAtLocations = [];
              }

              const squareModifierLocationOverride =
                squareModifierData?.locationOverrides;

              if (squareModifierLocationOverride) {
                // First, delete all existing ModifierLocationOverrides for this moaModifier
                const existingModifierLocationOverrides =
                  await this.modifierLocationOverridesService.find({
                    where: {
                      modifierId: moaModifier.id,
                    },
                  });
                for (const existingOverride of existingModifierLocationOverrides) {
                  await this.modifierLocationOverridesService.remove(
                    existingOverride,
                  );
                }

                // Then, recreate them based on the current Square data
                for (const modifierOverride of squareModifierLocationOverride) {
                  const moaLocationForModifierOverride = moaLocations.find(
                    (value) => {
                      return (
                        value.locationSquareId === modifierOverride.locationId
                      );
                    },
                  );

                  const moaModifierLocationOverride =
                    new ModifierLocationOverride();
                  moaModifierLocationOverride.modifierId = moaModifier.id;
                  moaModifierLocationOverride.locationId =
                    moaLocationForModifierOverride?.id;
                  moaModifierLocationOverride.amount = Number(
                    modifierOverride.priceMoney?.amount ?? 0,
                  );
                  moaModifierLocationOverride.currency =
                    modifierOverride.priceMoney?.currency;

                  await this.modifierLocationOverridesService.save(
                    moaModifierLocationOverride,
                  );
                }
              }

              await this.modifiersService.save(moaModifier);
            }
          }
        }
      }
    });

    return moaCatalog;
  }
}
