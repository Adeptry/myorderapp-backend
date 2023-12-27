import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogObject } from 'square';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { type WrapperType } from '../../utils/wrapper-type.js';
import {
  ItemPatchBody,
  ItemsPatchBody,
} from '../dto/catalogs/item-patch.dto.js';
import { CatalogImageEntity } from '../entities/catalog-image.entity.js';
import { ItemModifierListEntity } from '../entities/item-modifier-list.entity.js';
import { ItemEntity } from '../entities/item.entity.js';
import { CatalogImagesService } from './catalog-images.service.js';
import { CategoriesService } from './categories.service.js';
import { ItemModifierListService } from './item-modifier-list.service.js';
import { LocationsService } from './locations.service.js';
import { VariationsService } from './variations.service.js';

@Injectable()
export class ItemsService extends EntityRepositoryService<ItemEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(ItemEntity)
    protected readonly repository: Repository<ItemEntity>,
    @Inject(forwardRef(() => CategoriesService))
    private readonly categoriesService: WrapperType<CategoriesService>,
    private readonly catalogImagesService: CatalogImagesService,
    private readonly itemModifierListService: ItemModifierListService,
    private readonly locationsService: LocationsService,
    private readonly variationsService: VariationsService,
  ) {
    const logger = new Logger(ItemsService.name);
    super(repository, logger);
    this.logger = logger;
  }

  async squareSyncOrFail(params: {
    merchantId: string;
    squareItemCatalogObject: CatalogObject;
    catalogId: string;
    moaOrdinal: number;
  }) {
    this.logger.verbose(this.squareSyncOrFail.name);
    const { squareItemCatalogObject, catalogId, moaOrdinal, merchantId } =
      params;

    const moaLocations = await this.locationsService.find({
      where: { merchantId },
    });

    const squareItemData = squareItemCatalogObject?.itemData;
    const categorySquareId =
      squareItemData?.categoryId ?? squareItemData?.reportingCategory?.id;
    if (!squareItemData || !categorySquareId) {
      return;
    }

    this.logger.debug(
      `Processing item ${squareItemCatalogObject.itemData?.name}.`,
    );

    const moaCategory = await this.categoriesService.findOne({
      where: {
        squareId: categorySquareId,
        catalogId,
      },
    });

    if (!moaCategory) {
      throw new Error(`No category for ${squareItemData.categoryId}.`);
    }

    let moaItem = await this.findOne({
      where: {
        squareId: squareItemCatalogObject.id,
        catalogId,
      },
    });
    if (moaItem == null) {
      moaItem = this.create({
        squareId: squareItemCatalogObject.id,
        categoryId: moaCategory.id,
        catalogId,
        moaOrdinal: moaOrdinal,
        presentAtAllLocations: squareItemCatalogObject.presentAtAllLocations,
      });
    }

    moaItem.synced = true;
    moaItem.name = squareItemData.name;
    moaItem.description = squareItemData.description;
    moaItem.category = moaCategory;

    moaItem = await this.save(moaItem);

    await this.itemModifierListService.removeAll(
      await this.loadManyRelation<ItemModifierListEntity>(
        moaItem,
        'itemModifierLists',
      ),
    );
    for (const squareItemModifierListInfo of squareItemData.modifierListInfo ??
      []) {
      await this.itemModifierListService.process({
        squareItemModifierListInfo: squareItemModifierListInfo,
        moaItemId: moaItem.id!,
        catalogId,
      });
    }

    moaItem.presentAtAllLocations =
      squareItemCatalogObject.presentAtAllLocations;
    const itemPresentAtSquareLocationsIds =
      squareItemCatalogObject.presentAtLocationIds ?? [];
    if (itemPresentAtSquareLocationsIds.length > 0) {
      moaItem.presentAtLocations = moaLocations.filter((value) => {
        return (
          value.squareId &&
          itemPresentAtSquareLocationsIds.includes(value.squareId)
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
          value.squareId &&
          itemAbsentAtSquareLocationsIds.includes(value.squareId)
        );
      });
    } else {
      moaItem.absentAtLocations = [];
    }

    if (squareItemData.imageIds && squareItemData.imageIds.length > 0) {
      for (const squareImageId of squareItemData.imageIds) {
        const catalogImage = await this.catalogImagesService.findOne({
          where: { squareId: squareImageId, catalogId: catalogId },
        });

        if (catalogImage) {
          catalogImage.item = moaItem; // Associate the image to the item
          await this.catalogImagesService.save(catalogImage);
        }
        // Save changes to the image
      }
    } else {
      await this.catalogImagesService.removeAll(
        await this.loadManyRelation<CatalogImageEntity>(moaItem, 'images'),
      );
    }

    await moaItem.save();

    for (const squareItemDataVariation of squareItemData.variations ?? []) {
      await this.variationsService.process({
        squareCatalogObject: squareItemDataVariation,
        catalogId,
        merchantId,
        moaItemId: moaItem.id!,
      });
    }

    this.logger.verbose(`Processed item ${squareItemData.name}.`);
  }

  joinManyQuery(params: {
    categoryId: string;
    locationId?: string;
    page?: number;
    limit?: number;
    leftJoinVariations?: boolean;
    leftJoinModifierLists?: boolean;
    leftJoinImages?: boolean;
    whereOnlyEnabled?: boolean;
  }) {
    this.logger.verbose(this.joinManyQuery.name);

    const {
      categoryId,
      locationId,
      page,
      limit,
      leftJoinVariations,
      leftJoinModifierLists,
      leftJoinImages,
      whereOnlyEnabled,
    } = params;

    return this.join(
      this.createQueryBuilder('item').where('item.categoryId = :categoryId', {
        categoryId,
      }),
      {
        locationId,
        page,
        limit,
        leftJoinVariations,
        leftJoinModifierLists,
        leftJoinImages,
        whereOnlyEnabled,
      },
    );
  }

  joinOneQuery(params: {
    id: string;
    locationId?: string;
    leftJoinVariations?: boolean;
    leftJoinModifierLists?: boolean;
    leftJoinImages?: boolean;
    whereOnlyEnabled?: boolean;
  }) {
    this.logger.verbose(this.joinOneQuery.name);
    const {
      locationId,
      leftJoinVariations,
      leftJoinModifierLists,
      leftJoinImages,
      whereOnlyEnabled,
    } = params;

    return this.join(
      this.createQueryBuilder('item').where('item.id = :id', {
        id: params.id,
      }),
      {
        locationId,
        leftJoinVariations,
        leftJoinModifierLists,
        leftJoinImages,
        whereOnlyEnabled,
      },
    );
  }

  private join(
    query: SelectQueryBuilder<ItemEntity>,
    params: {
      locationId?: string;
      page?: number;
      limit?: number;
      leftJoinVariations?: boolean;
      leftJoinModifierLists?: boolean;
      leftJoinImages?: boolean;
      whereOnlyEnabled?: boolean;
    },
  ) {
    this.logger.verbose(this.join.name);
    const {
      locationId,
      leftJoinModifierLists,
      leftJoinVariations,
      leftJoinImages,
      whereOnlyEnabled,
      page,
      limit,
    } = params;

    if (whereOnlyEnabled) {
      query.andWhere('item.moaEnabled = true');
    }

    if (leftJoinImages) {
      query.leftJoinAndSelect('item.images', 'images');
    }

    if (locationId != null) {
      query.andWhere(
        '(EXISTS (SELECT 1 FROM items_present_at_locations WHERE "locationId" = :locationId AND "itemId" = item.id) OR ' +
          '(item.presentAtAllLocations = true AND NOT EXISTS (SELECT 1 FROM items_absent_at_locations WHERE "locationId" = :locationId AND "itemId" = item.id)))',
        { locationId },
      );
    }

    if (leftJoinModifierLists) {
      query
        .leftJoinAndSelect('item.itemModifierLists', 'itemModifierLists')
        .leftJoinAndSelect('itemModifierLists.modifierList', 'modifierLists')
        .leftJoinAndSelect('modifierLists.modifiers', 'modifiers');

      if (whereOnlyEnabled) {
        query.andWhere(
          new Brackets((qb) => {
            qb.where('itemModifierLists.enabled = true').orWhere(
              'itemModifierLists.enabled IS NULL',
            );
          }),
        );
      }

      if (locationId) {
        query
          .leftJoinAndSelect(
            'modifiers.locationOverrides',
            'modifierLocationOverrides',
            'modifierLocationOverrides.locationId = :locationId',
            { locationId },
          )
          .andWhere(
            '(itemModifierLists.id IS NULL OR EXISTS (SELECT 1 FROM modifiers_present_at_locations WHERE "locationId" = :locationId AND "modifierId" = modifiers.id) OR ' +
              '(modifiers.presentAtAllLocations = true AND NOT EXISTS (SELECT 1 FROM modifiers_absent_at_locations WHERE "locationId" = :locationId AND "modifierId" = modifiers.id)))',
            { locationId },
          )
          .addSelect(
            'COALESCE("modifierLocationOverrides"."priceMoneyAmount", modifiers.priceMoneyAmount)',
            'modifiers_priceMoneyAmount',
          );
      }
    }

    if (leftJoinVariations) {
      query.leftJoinAndSelect('item.variations', 'variations');

      if (locationId) {
        query
          .leftJoinAndSelect(
            'variations.locationOverrides',
            'variationLocationOverrides',
            '"variationLocationOverrides"."locationId" = :locationId',
            { locationId },
          )
          .addSelect(
            'COALESCE("variationLocationOverrides"."priceMoneyAmount", variations.priceMoneyAmount)',
            'variations_priceMoneyAmount',
          );
      }
    }

    if (limit) {
      query.take(limit);
    }

    if (page && limit) {
      query.skip(limit && (page - 1) * limit);
    }

    return query.orderBy('item.moaOrdinal', 'ASC');
  }

  async updateOne(params: { id: string; input: ItemPatchBody }) {
    this.logger.verbose(this.updateOne.name);
    const entity = await this.findOneOrFail({ where: { id: params.id } });
    if (params.input.moaOrdinal !== undefined) {
      entity.moaOrdinal = params.input.moaOrdinal;
    }
    if (params.input.moaEnabled !== undefined) {
      entity.moaEnabled = params.input.moaEnabled;
    }
    return await this.save(entity);
  }

  async updateAll(inputs: ItemsPatchBody[]) {
    this.logger.verbose(this.updateAll.name);
    const entities: ItemEntity[] = [];

    for (const input of inputs) {
      const entity = await this.findOneOrFail({
        where: { id: input.id },
      });
      if (input.moaOrdinal !== undefined) {
        entity.moaOrdinal = input.moaOrdinal;
      }
      if (input.moaEnabled !== undefined) {
        entity.moaEnabled = input.moaEnabled;
      }
      entities.push(entity);
    }

    return await this.saveAll(entities);
  }
}
