import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SquareService } from 'src/square/square.service';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { MoaSelectionType } from './dto/catalogs.types';
import { MoaCatalog } from './entities/catalog.entity';
import { MoaCategory } from './entities/category.entity';
import { MoaItem } from './entities/item.entity';
import { CategoriesService } from './services/categories.service';
import { ItemsService } from './services/items.service';
import { ModifierListsService } from './services/modifier-lists.service';
import { ModifiersService } from './services/modifiers.service';
import { VariationsService } from './services/variations.service';

@Injectable()
export class CatalogsService {
  constructor(
    @InjectRepository(MoaCatalog)
    private readonly catalogRepository: Repository<MoaCatalog>,
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
    return this.catalogRepository.create();
  }

  save(entity: MoaCatalog) {
    return this.catalogRepository.save(entity);
  }

  async squareSync(params: {
    squareAccessToken: string;
    catalogMoaId: string;
  }) {
    const squareClient = this.squareService.client(params.squareAccessToken);

    const squareCatalogObjects =
      (await this.squareService.listCatalog(squareClient)) ?? [];

    const moaCatalog = await this.findOneOrFail({
      where: { moaId: params.catalogMoaId },
    });

    // Categories

    const squareCategories = squareCatalogObjects.filter((value) => {
      return value.type === 'CATEGORY';
    });
    const moaCategories = await this.categoriesService.findMany({
      where: { catalog: { moaId: moaCatalog.moaId } },
    });
    const deletedMoaCategories = moaCategories.filter((moaValue) => {
      return !squareCategories.some((squareValue) => {
        return squareValue.id === moaValue.squareId;
      });
    });
    await this.categoriesService.removeAll(deletedMoaCategories);

    // Items

    const squareItems = squareCatalogObjects.filter((value) => {
      return value.type === 'ITEM';
    });
    const moaItems = moaCategories.flatMap((value: MoaCategory) => {
      return value.items ?? [];
    });
    const deletedMoaItems = moaItems.filter((moaValue) => {
      return !squareItems.some((squareValue) => {
        return squareValue.id === moaValue.squareId;
      });
    });
    await this.itemsService.removeAll(deletedMoaItems);

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

    // Modifiers lists

    const squareModifierLists = squareCatalogObjects.filter((value) => {
      return value.type === 'MODIFIER_LIST';
    });
    const moaModifierLists = (
      moaItems.flatMap((value: MoaItem) => {
        return value.modifierLists ?? [];
      }) ?? []
    ).filter(
      (value1, index, array) =>
        index === array.findIndex((value2) => value2.moaId === value1.moaId),
    );
    const deletedMoaModifierLists = moaModifierLists.filter((moaValue) => {
      return !squareModifierLists.some((squareValue) => {
        return squareValue.id === moaValue.squareId;
      });
    });
    await this.modifierListsService.removeAll(deletedMoaModifierLists);

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
          index === array.findIndex((value2) => value2.moaId === value1.moaId),
      );
    const deletedMoaModifiers = moaModifiers.filter((moaValue) => {
      return !squareModifiers.some((squareValue) => {
        return squareValue.id === moaValue.squareId;
      });
    });
    await this.modifiersService.removeAll(deletedMoaModifiers);

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
        }

        const squareItemData = squareItemForCategory.itemData;
        if (squareItemData == null) {
          continue;
        }

        moaItem.name = squareItemData.name;
        moaItem.description = squareItemData.description;
        moaItem.category = moaCategory;
        await this.itemsService.save(moaItem);

        let minPriceInCents = Number(9999);
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
            }));

          if (moaModifierList === null) {
            moaModifierList = await this.modifierListsService.create(
              squareModifierListInfo.modifierListId,
            );
          }

          if (
            !moaItem.modifierLists?.some((value) => {
              return value.moaId === moaModifierList?.moaId;
            })
          ) {
            moaItem.modifierLists?.push(moaModifierList);
            await this.itemsService.save(moaItem);
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

  // Access

  findOne(options: FindOneOptions<MoaCatalog>) {
    return this.catalogRepository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<MoaCatalog>) {
    return this.catalogRepository.findOneOrFail(options);
  }

  getOneOrderedOrFail(params: {
    catalogMoaId?: string;
    onlyShowEnabled?: boolean;
  }) {
    const queryBuilder = this.catalogRepository
      .createQueryBuilder('catalog')
      .where('catalog.moaId = :moaId', { moaId: params.catalogMoaId })
      .leftJoinAndSelect('catalog.categories', 'categories')
      .leftJoinAndSelect('categories.items', 'items')
      .leftJoinAndSelect('items.modifierLists', 'modifierLists')
      .leftJoinAndSelect('modifierLists.modifiers', 'modifiers')
      .leftJoinAndSelect('items.variations', 'variations')
      .leftJoinAndSelect('items.image', 'image')
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

  findAll(options?: FindManyOptions<MoaCatalog>) {
    return this.catalogRepository.find(options);
  }

  async loadCatalogForCategory(
    category: MoaCategory,
  ): Promise<MoaCatalog | null | undefined> {
    return await this.catalogRepository
      .createQueryBuilder()
      .relation(MoaCategory, 'catalog')
      .of(category)
      .loadOne();
  }
}
