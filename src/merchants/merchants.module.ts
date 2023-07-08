import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SquareModule } from '../square/square.module';
import { StripeModule } from '../stripe/stripe.module';
import { MoaCatalog } from './entities/catalog.entity';
import { MoaCategory } from './entities/category.entity';
import { MoaItem } from './entities/item.entity';
import { MoaMerchant } from './entities/merchant.entity';
import { MoaModifierList } from './entities/modifier-list.entity';
import { MoaModifier } from './entities/modifier.entity';
import { MoaVariation } from './entities/variation.entity';

import { UsersModule } from 'src/users/users.module';
import { CatalogsService } from './services/catalogs.service';
import { CategoriesService } from './services/categories.service';
import { ItemsService } from './services/items.service';
import { MerchantsService } from './services/merchants.service';
import { ModifierListsService } from './services/modifier-lists.service';
import { ModifiersService } from './services/modifiers.service';
import { VariationsService } from './services/variations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MoaMerchant,
      MoaItem,
      MoaCategory,
      MoaCatalog,
      MoaModifierList,
      MoaVariation,
      MoaModifier,
    ]),
    forwardRef(() => StripeModule),
    forwardRef(() => SquareModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [],
  providers: [
    MerchantsService,
    CatalogsService,
    ItemsService,
    VariationsService,
    ModifiersService,
    ModifierListsService,
    CategoriesService,
  ],
  exports: [MerchantsService],
})
export class MerchantsModule {}
