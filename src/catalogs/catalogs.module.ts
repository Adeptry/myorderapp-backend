import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CatalogsService } from 'src/catalogs/catalogs.service';
import { MoaCatalog } from 'src/catalogs/entities/catalog.entity';
import { MoaCategory } from 'src/catalogs/entities/category.entity';
import { MoaItem } from 'src/catalogs/entities/item.entity';
import { MoaModifierList } from 'src/catalogs/entities/modifier-list.entity';
import { MoaModifier } from 'src/catalogs/entities/modifier.entity';
import { MoaVariation } from 'src/catalogs/entities/variation.entity';
import { CategoriesService } from 'src/catalogs/services/categories.service';
import { ItemsService } from 'src/catalogs/services/items.service';
import { ModifierListsService } from 'src/catalogs/services/modifier-lists.service';
import { ModifiersService } from 'src/catalogs/services/modifiers.service';
import { VariationsService } from 'src/catalogs/services/variations.service';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { SquareModule } from 'src/square/square.module';
import { CatalogsController } from './catalogs.controller';
import { CategoriesController } from './controllers/categories.controller';
import { ItemsController } from './controllers/items.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MoaItem,
      MoaCategory,
      MoaCatalog,
      MoaModifierList,
      MoaVariation,
      MoaModifier,
    ]),
    forwardRef(() => SquareModule),
    forwardRef(() => AuthModule),
    forwardRef(() => MerchantsModule),
  ],
  exports: [
    CatalogsService,
    ItemsService,
    VariationsService,
    ModifiersService,
    ModifierListsService,
    CategoriesService,
  ],
  providers: [
    CatalogsService,
    ItemsService,
    VariationsService,
    ModifiersService,
    ModifierListsService,
    CategoriesService,
  ],
  controllers: [CatalogsController, CategoriesController, ItemsController],
})
export class CatalogsModule {}
