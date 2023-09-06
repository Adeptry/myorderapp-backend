import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogObject } from 'square';
import {
  CategoryUpdateAllDto,
  CategoryUpdateDto,
} from 'src/catalogs/dto/category-update.dto';
import { Category } from 'src/catalogs/entities/category.entity';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { paginatedResults } from 'src/utils/paginated';
import { Repository } from 'typeorm';
import { CatalogSortService } from './catalog-sort.service';
import { ItemsService } from './items.service';

@Injectable()
export class CategoriesService extends EntityRepositoryService<Category> {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    protected readonly repository: Repository<Category>,
    private readonly itemsService: ItemsService,
    private readonly catalogSortService: CatalogSortService,
  ) {
    super(repository);
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
              })
              .getMany(),
          );
        }),
      );
    }

    return paginatedResults({
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
  async processAndSave(params: {
    squareCategoryCatalogObject: CatalogObject;
    moaCatalogId: string;
    moaOrdinal: number;
  }) {
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
      this.logger.verbose(
        `Created category ${squareCategoryCatalogObject.categoryData?.name}.`,
      );
    }

    moaCategory.name = squareCategoryCatalogObject.categoryData?.name;
    return await this.save(moaCategory);
  }

  async assignAndSave(params: { id: string; input: CategoryUpdateDto }) {
    const entity = await this.findOneOrFail({
      where: { id: params.id },
    });
    if (params.input.moaOrdinal != undefined) {
      this.logger.verbose(
        `Updating category ${params.id} moaOrdinal: ${params.input.moaOrdinal}`,
      );
      entity.moaOrdinal = params.input.moaOrdinal;
    }
    if (params.input.moaEnabled != undefined) {
      entity.moaEnabled = params.input.moaEnabled;
    }
    return await this.save(entity);
  }

  async updateAll(inputs: CategoryUpdateAllDto[]) {
    const entities: Category[] = [];

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
