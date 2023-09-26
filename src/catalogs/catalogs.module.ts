import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { CatalogsService } from '../catalogs/catalogs.service.js';
import { Catalog } from '../catalogs/entities/catalog.entity.js';
import { Category } from '../catalogs/entities/category.entity.js';
import { Item } from '../catalogs/entities/item.entity.js';
import { ModifierList } from '../catalogs/entities/modifier-list.entity.js';
import { Modifier } from '../catalogs/entities/modifier.entity.js';
import { Variation } from '../catalogs/entities/variation.entity.js';
import { CategoriesService } from '../catalogs/services/categories.service.js';
import { ItemsService } from '../catalogs/services/items.service.js';
import { ModifierListsService } from '../catalogs/services/modifier-lists.service.js';
import { ModifiersService } from '../catalogs/services/modifiers.service.js';
import { VariationsService } from '../catalogs/services/variations.service.js';
import { CustomersModule } from '../customers/customers.module.js';
import { LocationsModule } from '../locations/locations.module.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { SquareModule } from '../square/square.module.js';
import { CategoriesController } from './controllers/categories.controller.js';
import { ItemsController } from './controllers/items.controller.js';
import { VariationsController } from './controllers/variations.controller.js';
import { CatalogImage } from './entities/catalog-image.entity.js';
import { ItemModifierList } from './entities/item-modifier-list.entity.js';
import { ModifierLocationOverride } from './entities/modifier-location-override.entity.js';
import { VariationLocationOverride } from './entities/variation-location-override.entity.js';
import { CatalogImagesService } from './services/catalog-images.service.js';
import { CatalogSortService } from './services/catalog-sort.service.js';
import { ItemModifierListService } from './services/item-modifier-list.service.js';
import { ModifierLocationOverridesService } from './services/modifier-location-overrides.service.js';
import { VariationLocationOverridesService } from './services/variation-location-overrides.service.js';

@Module({
  imports: [
    AuthenticationModule,
    TypeOrmModule.forFeature([
      Item,
      Category,
      Catalog,
      ModifierList,
      Variation,
      Modifier,
      CatalogImage,
      ModifierLocationOverride,
      VariationLocationOverride,
      ItemModifierList,
    ]),
    SquareModule,
    CustomersModule,
    LocationsModule,
    forwardRef(() => MerchantsModule),
  ],
  exports: [
    CatalogsService,
    ItemsService,
    VariationsService,
    ModifiersService,
    ModifierListsService,
    CategoriesService,
    CatalogImagesService,
    VariationLocationOverridesService,
    ModifierLocationOverridesService,
    ItemModifierListService,
  ],
  providers: [
    CatalogsService,
    ItemsService,
    VariationsService,
    ModifiersService,
    ModifierListsService,
    CategoriesService,
    CatalogImagesService,
    VariationLocationOverridesService,
    ModifierLocationOverridesService,
    CatalogSortService,
    ItemModifierListService,
  ],
  controllers: [CategoriesController, ItemsController, VariationsController],
})
export class CatalogsModule {}
