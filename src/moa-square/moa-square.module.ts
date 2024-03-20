/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthAppleModule } from '../auth-apple/auth-apple.module.js';
import { AuthGoogleModule } from '../auth-google/auth-google.module.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { MailModule } from '../mail/mail.module.js';
import { MessagesModule } from '../messages/messages.module.js';
import { PushModule } from '../push/push.module.js';
import { UsersModule } from '../users/users.module.js';
import { AppConfigController } from './controllers/app-config.controller.js';
import { CardsController } from './controllers/cards.controller.js';
import { CategoriesController } from './controllers/categories.controller.js';
import { CustomersController } from './controllers/customers.controller.js';
import { ItemsController } from './controllers/items.controller.js';
import { LocationsController } from './controllers/locations.controller.js';
import { MerchantsController } from './controllers/merchants.controller.js';
import { OrdersController } from './controllers/orders.controller.js';
import { SquareWebhookController } from './controllers/square-webhook.controller.js';
import { StripeWebhookController } from './controllers/stripe-webhook.controller.js';
import { VariationsController } from './controllers/variations.controller.js';
import { AddressEntity } from './entities/address.entity.js';
import { AppConfigEntity } from './entities/app-config.entity.js';
import { AppInstallEntity } from './entities/app-install.entity.js';
import { BusinessHoursPeriodEntity } from './entities/business-hours-period.entity.js';
import { CatalogImageEntity } from './entities/catalog-image.entity.js';
import { CatalogEntity } from './entities/catalog.entity.js';
import { CategoryEntity } from './entities/category.entity.js';
import { CustomerEntity } from './entities/customer.entity.js';
import { ItemModifierListEntity } from './entities/item-modifier-list.entity.js';
import { ItemEntity } from './entities/item.entity.js';
import { LineItemModifierEntity } from './entities/line-item-modifier.entity.js';
import { LineItemEntity } from './entities/line-item.entity.js';
import { LocationEntity } from './entities/location.entity.js';
import { MerchantEntity } from './entities/merchant.entity.js';
import { ModifierListEntity } from './entities/modifier-list.entity.js';
import { ModifierLocationOverrideEntity } from './entities/modifier-location-override.entity.js';
import { ModifierEntity } from './entities/modifier.entity.js';
import { OrderEntity } from './entities/order.entity.js';
import { VariationLocationOverride } from './entities/variation-location-override.entity.js';
import { VariationEntity } from './entities/variation.entity.js';
import { CustomerMerchantGuard } from './guards/customer-merchant.guard.js';
import { CustomersGuard } from './guards/customers.guard.js';
import { MerchantsGuard } from './guards/merchants.guard.js';
import { MyOrderAppSquareConfig } from './moa-square.config.js';
import { AddressService } from './services/address.service.js';
import { AppConfigService } from './services/app-config.service.js';
import { AppInstallsService } from './services/app-installs.service.js';
import { BusinessHoursPeriodsService } from './services/business-hours-period.service.js';
import { CatalogImagesService } from './services/catalog-images.service.js';
import { CatalogSortService } from './services/catalog-sort.service.js';
import { CatalogsService } from './services/catalogs.service.js';
import { CategoriesService } from './services/categories.service.js';
import { CustomersService } from './services/customers.service.js';
import { ItemModifierListService } from './services/item-modifier-list.service.js';
import { ItemsService } from './services/items.service.js';
import { LineItemModifierService } from './services/line-item-modifier.service.js';
import { LineItemService } from './services/line-item.service.js';
import { LocationsService } from './services/locations.service.js';
import { MerchantsService } from './services/merchants.service.js';
import { MerchantsSquareService } from './services/merchants.square.service.js';
import { MerchantsStripeService } from './services/merchants.stripe.service.js';
import { ModifierListsService } from './services/modifier-lists.service.js';
import { ModifierLocationOverridesService } from './services/modifier-location-overrides.service.js';
import { ModifiersService } from './services/modifiers.service.js';
import { OrdersService } from './services/orders.service.js';
import { VariationLocationOverridesService } from './services/variation-location-overrides.service.js';
import { VariationsService } from './services/variations.service.js';

@Module({
  imports: [
    AuthenticationModule,
    AuthGoogleModule,
    AuthAppleModule,
    UsersModule,
    MailModule,
    MessagesModule,
    PushModule,
    ConfigModule.forFeature(MyOrderAppSquareConfig),
    TypeOrmModule.forFeature([
      ItemEntity,
      CategoryEntity,
      CatalogEntity,
      ModifierListEntity,
      VariationEntity,
      ModifierEntity,
      CatalogImageEntity,
      ModifierLocationOverrideEntity,
      VariationLocationOverride,
      ItemModifierListEntity,
      LocationEntity,
      AddressEntity,
      BusinessHoursPeriodEntity,
      CustomerEntity,
      AppInstallEntity,
      AppConfigEntity,
      MerchantEntity,
      OrderEntity,
      LineItemEntity,
      LineItemModifierEntity,
    ]),
  ],
  exports: [MerchantsSquareService, AppConfigService],
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
    LocationsService,
    BusinessHoursPeriodsService,
    AddressService,
    CustomersService,
    AppInstallsService,
    CustomersGuard,
    CustomerMerchantGuard,
    AppConfigService,
    MerchantsService,
    MerchantsSquareService,
    MerchantsStripeService,
    MerchantsGuard,
    OrdersService,
    LineItemService,
    LineItemModifierService,
  ],
  controllers: [
    CategoriesController,
    ItemsController,
    VariationsController,
    LocationsController,
    CustomersController,
    CardsController,
    AppConfigController,
    MerchantsController,
    OrdersController,
    SquareWebhookController,
    StripeWebhookController,
  ],
})
export class MyOrderAppSquareModule {}
