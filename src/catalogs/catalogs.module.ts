import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CatalogsService } from 'src/catalogs/catalogs.service';
import { Catalog } from 'src/catalogs/entities/catalog.entity';
import { Category } from 'src/catalogs/entities/category.entity';
import { Item } from 'src/catalogs/entities/item.entity';
import { ModifierList } from 'src/catalogs/entities/modifier-list.entity';
import { Modifier } from 'src/catalogs/entities/modifier.entity';
import { Variation } from 'src/catalogs/entities/variation.entity';
import { CategoriesService } from 'src/catalogs/services/categories.service';
import { ItemsService } from 'src/catalogs/services/items.service';
import { ModifierListsService } from 'src/catalogs/services/modifier-lists.service';
import { ModifiersService } from 'src/catalogs/services/modifiers.service';
import { VariationsService } from 'src/catalogs/services/variations.service';
import { CustomersModule } from 'src/customers/customers.module';
import { GuardsModule } from 'src/guards/guards.module';
import { LocationsModule } from 'src/locations/locations.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { SquareModule } from 'src/square/square.module';
import { CatalogsController } from './catalogs.controller';
import { CategoriesController } from './controllers/categories.controller';
import { ItemsController } from './controllers/items.controller';
import { CatalogImage } from './entities/catalog-image.entity';
import { ModifierLocationOverride } from './entities/modifier-location-override.entity';
import { VariationLocationOverride } from './entities/variation-location-override.entity';
import { CatalogImagesService } from './services/catalog-images.service';
import { CatalogSortService } from './services/catalog-sort.service';
import { ModifierLocationOverridesService } from './services/modifier-location-overrides.service';
import { VariationLocationOverridesService } from './services/variation-location-overrides.service';

@Module({
  imports: [
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
    ]),
    LocationsModule,
    AuthModule,
    SquareModule,
    forwardRef(() => GuardsModule),
    forwardRef(() => MerchantsModule),
    forwardRef(() => CustomersModule),
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
  ],
  controllers: [CatalogsController, CategoriesController, ItemsController],
})
export class CatalogsModule {}
