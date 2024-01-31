import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogObject } from 'square';
import { Repository } from 'typeorm';
import { buildPaginatedResults } from '../../database/build-paginated-results.js';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { type WrapperType } from '../../utils/wrapper-type.js';
import {
  CategoriesPatchBody,
  CategoryPatchBody,
} from '../dto/catalogs/category-patch.dto.js';
import { CategoryEntity } from '../entities/category.entity.js';
import { CatalogSortService } from './catalog-sort.service.js';
import { ItemsService } from './items.service.js';

@Injectable()
export class CategoriesService extends EntityRepositoryService<CategoryEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(CategoryEntity)
    protected readonly repository: Repository<CategoryEntity>,
    @Inject(forwardRef(() => ItemsService))
    private readonly itemsService: WrapperType<ItemsService>,
    private readonly catalogSortService: CatalogSortService,
  ) {
    const logger = new Logger(CategoriesService.name);
    super(repository, logger);
    this.logger = logger;
  }

  async findPaginatedResults(params: {
    catalogId: string;
    whereOnlyEnabled: boolean | undefined;
    limit: number | undefined;
    page: number | undefined;
    locationId: string | undefined;
    leftJoinItems: boolean | undefined;
    leftJoinImages: boolean | undefined;
    leftJoinVariations: boolean | undefined;
    leftJoinModifierLists: boolean | undefined;
  }) {
    this.logger.verbose(this.findPaginatedResults.name);
    const {
      catalogId,
      whereOnlyEnabled,
      limit,
      page,
      leftJoinItems,
      leftJoinImages,
      locationId,
      leftJoinVariations,
      leftJoinModifierLists,
    } = params;
    const results = await this.findAndCount({
      where: {
        catalogId: catalogId,
        moaEnabled: whereOnlyEnabled,
      },
      order: { moaOrdinal: 'ASC' },
      take: limit,
      skip: page && limit && (page - 1) * limit,
    });

    if (leftJoinItems) {
      await Promise.all(
        results[0].map(async (category) => {
          if (!category.id) {
            return;
          }
          category.items = this.catalogSortService.sortItems(
            await this.itemsService
              .joinManyQuery({
                categoryId: category.id,
                locationId,
                leftJoinImages,
                leftJoinVariations,
                leftJoinModifierLists,
                whereOnlyEnabled,
                limit: 30, // emergency fallback
              })
              .getMany(),
          );
        }),
      );
    }

    results[0] = results[0].filter(
      (category) => (category.items?.length ?? 0) > 0,
    );

    return buildPaginatedResults({
      results,
      pagination: {
        page: page ?? 0,
        limit: limit ?? 0,
      },
    });
  }

  /*
   {
      "type": "CATEGORY",
      "id": "KUSUMGI746SRBXYBJ2EWHQDN",
      "updated_at": "2022-10-19T19:33:57.869Z",
      "created_at": "2021-07-21T16:58:30.267Z",
      "version": 1666208037869,
      "is_deleted": false,
      "present_at_all_locations": true,
      "category_data": {
        "name": "Hot Stuff",
        "is_top_level": true
      }
    },
  */
  async squareSyncOrFail(params: {
    squareCategoryCatalogObject: CatalogObject;
    moaCatalogId: string;
    moaOrdinal: number;
  }) {
    this.logger.verbose(this.squareSyncOrFail.name);
    const { squareCategoryCatalogObject, moaCatalogId, moaOrdinal } = params;
    this.logger.verbose(
      `Processing category ${squareCategoryCatalogObject.categoryData?.name}.`,
    );
    let moaCategory = await this.findOne({
      where: {
        squareId: squareCategoryCatalogObject.id,
        catalogId: moaCatalogId,
      },
    });

    if (moaCategory == null) {
      moaCategory = this.create({
        squareId: squareCategoryCatalogObject.id,
        catalogId: moaCatalogId,
      });
      moaCategory.moaOrdinal = moaOrdinal;
      this.logger.debug(
        `Created category ${squareCategoryCatalogObject.categoryData?.name}.`,
      );
    }

    moaCategory.synced = true;
    moaCategory.name = squareCategoryCatalogObject.categoryData?.name;
    this.logger.verbose(`Updated category ${moaCategory.name}.`);
    return await this.save(moaCategory);
  }

  async updateOne(params: { id: string; input: CategoryPatchBody }) {
    this.logger.verbose(this.updateOne.name);
    const entity = await this.findOneOrFail({
      where: { id: params.id },
    });
    if (params.input.moaOrdinal != undefined) {
      this.logger.debug(
        `Updating category ${params.id} moaOrdinal: ${params.input.moaOrdinal}`,
      );
      entity.moaOrdinal = params.input.moaOrdinal;
    }
    if (params.input.moaEnabled != undefined) {
      entity.moaEnabled = params.input.moaEnabled;
    }
    return await this.save(entity);
  }

  async updateAll(inputs: CategoriesPatchBody[]) {
    this.logger.verbose(this.updateAll.name);
    const entities: CategoryEntity[] = [];

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
