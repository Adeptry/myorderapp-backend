import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SquareService } from 'src/square/square.service';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { MoaSelectionType } from './dto/catalogs.types';
import { Catalog } from './entities/catalog.entity';
import { Category } from './entities/category.entity';
import { Item } from './entities/item.entity';
import { CategoriesService } from './services/categories.service';
import { ItemsService } from './services/items.service';
import { ModifierListsService } from './services/modifier-lists.service';
import { ModifiersService } from './services/modifiers.service';
import { VariationsService } from './services/variations.service';

@Injectable()
export class CatalogsService {
  private readonly logger = new Logger(CatalogsService.name);

  constructor(
    @InjectRepository(Catalog)
    private readonly repository: Repository<Catalog>,
    @Inject(forwardRef(() => SquareService))
    private readonly squareService: SquareService,
    @Inject(forwardRef(() => ItemsService))
    private readonly itemsService: ItemsService,
    @Inject(forwardRef(() => VariationsService))
    private readonly variationsService: VariationsService,
    @Inject(forwardRef(() => ModifiersService))
    private readonly modifiersService: ModifiersService,
    @Inject(forwardRef(() => ModifierListsService))
    private readonly modifierListsService: ModifierListsService,
    @Inject(forwardRef(() => CategoriesService))
    private readonly categoriesService: CategoriesService,
  ) {}

  create() {
    return this.repository.create();
  }

  save(entity: Catalog) {
    return this.repository.save(entity);
  }

  // Access

  findOne(options: FindOneOptions<Catalog>) {
    return this.repository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<Catalog>) {
    return this.repository.findOneOrFail(options);
  }

  getOneOrderedOrFail(params: {
    catalogId?: string;
    onlyShowEnabled?: boolean;
  }) {
    const queryBuilder = this.repository
      .createQueryBuilder('catalog')
      .where('catalog.id = :id', { id: params.catalogId })
      .leftJoinAndSelect('catalog.categories', 'categories')
      .leftJoinAndSelect('categories.items', 'items')
      .leftJoinAndSelect('items.modifierLists', 'modifierLists')
      .leftJoinAndSelect('modifierLists.modifiers', 'modifiers')
      .leftJoinAndSelect('items.variations', 'variations')
      // .leftJoinAndSelect('items.image', 'image')
      .orderBy('categories.moaOrdinal', 'ASC')
      .addOrderBy('items.moaOrdinal', 'ASC')
      .addOrderBy('modifiers.ordinal', 'ASC')
      .addOrderBy('variations.ordinal', 'ASC');

    if (params.onlyShowEnabled) {
      queryBuilder.andWhere('categories.moaEnabled = true');
      queryBuilder.andWhere('items.moaEnabled = true');
    }

    return queryBuilder.getOneOrFail();
  }

  findAll(options?: FindManyOptions<Catalog>) {
    return this.repository.find(options);
  }

  async loadCatalogForCategory(
    category: Category,
  ): Promise<Catalog | null | undefined> {
    return await this.repository
      .createQueryBuilder()
      .relation(Category, 'catalog')
      .of(category)
      .loadOne();
  }

  async loadCategories(entity: Catalog): Promise<Category[]> {
    return this.repository
      .createQueryBuilder()
      .relation(Catalog, 'categories')
      .of(entity)
      .loadMany();
  }

  async squareSync(params: { squareAccessToken: string; catalogId: string }) {
    const squareClient = this.squareService.client(params.squareAccessToken);

    const squareCatalogObjects =
      (await this.squareService.listCatalog(squareClient)) ?? [];

    const moaCatalog = await this.getOneOrderedOrFail({
      catalogId: params.catalogId,
      onlyShowEnabled: false,
    });

    // Categories

    const squareCategories = squareCatalogObjects.filter((value) => {
      return value.type === 'CATEGORY';
    });
    const moaCategories = moaCatalog.categories ?? [];
    const deletedMoaCategories = moaCategories.filter((moaValue) => {
      return !squareCategories.some((squareValue) => {
        return squareValue.id === moaValue.squareId;
      });
    });
    await this.categoriesService.removeAll(deletedMoaCategories);
    this.logger.log(`Deleted ${deletedMoaCategories.length} categories.`);

    // Items

    const squareItems = squareCatalogObjects.filter((value) => {
      return value.type === 'ITEM';
    });
    const moaItems = moaCategories.flatMap((value: Category) => {
      return value.items ?? [];
    });
    this.logger.log(`Found ${moaItems.length} items.`);
    const deletedMoaItems = moaItems.filter((moaValue) => {
      return !squareItems.some((squareValue) => {
        return squareValue.id === moaValue.squareId;
      });
    });
    await this.itemsService.removeAll(deletedMoaItems);
    this.logger.log(`Deleted ${deletedMoaItems.length} items.`);

    // Variations

    const squareItemVariations = squareCatalogObjects.filter((value) => {
      return value.type === 'ITEM_VARIATION';
    });
    const moaVariations = moaItems.flatMap((value) => {
      return value.variations ?? [];
    });
    const deletedMoaVariations = moaVariations.filter((moaValue) => {
      return !squareItemVariations.some((squareValue) => {
        return squareValue.id === moaValue.squareId;
      });
    });
    await this.variationsService.removeAll(deletedMoaVariations);
    this.logger.log(`Deleted ${deletedMoaVariations.length} variations.`);

    // Modifiers lists

    const squareModifierLists = squareCatalogObjects.filter((value) => {
      return value.type === 'MODIFIER_LIST';
    });
    const moaDuplicatedModifierLists =
      moaItems.flatMap((value: Item) => {
        return value.modifierLists ?? [];
      }) ?? [];
    this.logger.log(
      `Found ${moaDuplicatedModifierLists.length} duplicated modifier lists.`,
    );
    const moaModifierLists = moaDuplicatedModifierLists.filter(
      (value1, index, array) =>
        index === array.findIndex((value2) => value2.id === value1.id),
    );
    this.logger.log(`Found ${moaModifierLists.length} modifier lists.`);
    const deletedMoaModifierLists = moaModifierLists.filter((moaValue) => {
      return !squareModifierLists.some((squareValue) => {
        return squareValue.id === moaValue.squareId;
      });
    });
    await this.modifierListsService.removeAll(deletedMoaModifierLists);
    this.logger.log(
      `Deleted ${deletedMoaModifierLists.length} modifier lists.`,
    );

    // Modifiers

    const squareModifiers = squareCatalogObjects.filter((value) => {
      return value.type === 'MODIFIER';
    });
    const moaModifiers = moaModifierLists
      .flatMap((value) => {
        return value?.modifiers ?? [];
      })
      .filter(
        (value1, index, array) =>
          index === array.findIndex((value2) => value2.id === value1.id),
      );
    const deletedMoaModifiers = moaModifiers.filter((moaValue) => {
      return !squareModifiers.some((squareValue) => {
        return squareValue.id === moaValue.squareId;
      });
    });
    await this.modifiersService.removeAll(deletedMoaModifiers);
    this.logger.log(`Deleted ${deletedMoaModifiers.length} modifiers.`);

    // Main loop

    for (const [
      squareCategoryIndex,
      squareCategory,
    ] of squareCategories.entries()) {
      let moaCategory = moaCategories.find((value) => {
        return value.squareId === squareCategory.id;
      });

      if (moaCategory == null) {
        moaCategory = await this.categoriesService.create(
          squareCategory.id,
          moaCatalog,
        );
        moaCategory.moaOrdinal = squareCategoryIndex;
        this.logger.log(
          `Created category ${moaCategory.name} ${moaCategory.id}.`,
        );
      }

      moaCategory.name = squareCategory.categoryData?.name;
      await this.categoriesService.save(moaCategory);

      const squareItemsForCategory = squareItems.filter((value) => {
        return value.itemData?.categoryId === squareCategory.id;
      });

      for (const [
        squareItemForCategoryIndex,
        squareItemForCategory,
      ] of squareItemsForCategory.entries()) {
        let moaItem =
          moaItems.find((value) => {
            return value.squareId === squareItemForCategory.id;
          }) ??
          (await this.itemsService.findOne({
            where: { squareId: squareItemForCategory.id },
          }));
        if (moaItem === null) {
          moaItem = await this.itemsService.create(
            squareItemForCategory.id,
            moaCategory,
          );
          moaItem.moaOrdinal = squareItemForCategoryIndex;
          this.logger.log(`Created item ${moaItem.name} ${moaItem.id}.`);
        }

        const squareItemData = squareItemForCategory.itemData;
        if (squareItemData == null) {
          continue;
        }

        moaItem.name = squareItemData.name;
        moaItem.description = squareItemData.description;
        moaItem.category = moaCategory;
        await this.itemsService.save(moaItem);

        let minPriceInCents = Number(9999999);
        for (const squareVariation of squareItemData.variations ?? []) {
          let moaVariation =
            moaVariations.find((value) => {
              return value.squareId === squareVariation.id;
            }) ??
            (await this.variationsService.findOne({
              where: { squareId: squareVariation.id },
            }));

          if (moaVariation === null) {
            moaVariation = await this.variationsService.create({
              squareId: squareVariation.id,
              item: moaItem,
            });
            this.logger.log(
              `Created variation ${moaVariation.name} ${moaVariation.id}.`,
            );
          }

          const squareVariationData = squareVariation.itemVariationData;
          let changed = false;
          if (squareVariationData == null) {
            continue;
          }

          if (moaVariation.name !== squareVariationData.name) {
            moaVariation.name = squareVariationData.name;
            changed = true;
          }
          if (moaVariation.ordinal !== squareVariationData.ordinal) {
            moaVariation.ordinal = squareVariationData.ordinal;
            changed = true;
          }

          const squareVariationDataPriceInCents =
            Number(squareVariationData.priceMoney?.amount ?? 0) ?? 0;
          if (moaVariation.priceInCents !== squareVariationDataPriceInCents) {
            moaVariation.priceInCents = squareVariationDataPriceInCents;
            changed = true;
          }

          minPriceInCents = Math.min(
            minPriceInCents,
            moaVariation.priceInCents,
          );

          if (changed) {
            try {
              this.logger.log(
                `Variation changed ${moaVariation.name} ${moaVariation.id}.`,
              );
              await this.variationsService.save(moaVariation);
            } catch (error) {
              console.log(error);
            }
          }
        }

        moaItem.priceInCents = minPriceInCents;
        await this.itemsService.save(moaItem);

        for (const squareModifierListInfo of squareItemForCategory.itemData
          ?.modifierListInfo ?? []) {
          const squareModifierList = squareModifierLists.find((value) => {
            return value.id === squareModifierListInfo.modifierListId;
          });
          const squareModifierListData = squareModifierList?.modifierListData;

          let moaModifierList =
            moaModifierLists.find((value) => {
              return value.squareId === squareModifierListInfo.modifierListId;
            }) ??
            (await this.modifierListsService.findOne({
              where: { squareId: squareModifierListInfo.modifierListId },
              relations: ['items'],
            }));

          if (moaModifierList === null) {
            moaModifierList = await this.modifierListsService.create(
              squareModifierListInfo.modifierListId,
            );
            this.logger.log(
              `Created modifier list ${moaModifierList.name} ${moaModifierList.id}.`,
            );
          }

          if (!moaModifierList.items) {
            moaModifierList.items =
              await this.modifierListsService.loadItemsForModifierList(
                moaModifierList,
              );
          }

          if (
            !moaModifierList.items?.some((value) => {
              return value.id === moaItem?.id;
            })
          ) {
            moaModifierList.items?.push(moaItem);
            this.logger.log(
              `Added ${moaItem.name} ${moaItem.id} to modifier list ${moaModifierList.name} ${moaModifierList.id}.`,
            );
          }

          moaModifierList.maxSelectedModifiers =
            squareModifierListInfo.maxSelectedModifiers;
          moaModifierList.minSelectedModifiers =
            squareModifierListInfo.minSelectedModifiers;
          moaModifierList.enabled = squareModifierListInfo.enabled;
          moaModifierList.name = squareModifierListData?.name;
          moaModifierList.selectionType =
            (squareModifierList?.modifierListData
              ?.selectionType as MoaSelectionType) ?? MoaSelectionType.MULTIPLE;

          await this.modifierListsService.save(moaModifierList);

          for (const squareModifier of squareModifierListData?.modifiers ??
            []) {
            let moaModifier =
              moaModifiers.find((value) => {
                return value.squareId === squareModifier.id;
              }) ??
              (await this.modifiersService.findOne({
                where: { squareId: squareModifier.id },
              }));
            if (moaModifier === null) {
              moaModifier = await this.modifiersService.create(
                squareModifier.id,
                moaModifierList,
              );
              moaModifiers.push(moaModifier);
              this.logger.log(
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
          }
        }
      }
    }

    return moaCatalog;
  }
}
