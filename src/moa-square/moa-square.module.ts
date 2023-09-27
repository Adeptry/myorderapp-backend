import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { MailModule } from '../mail/mail.module.js';
import { UsersModule } from '../users/users.module.js';
import { AppConfigController } from './controllers/app-config/app-config.controller.js';
import { CardsController } from './controllers/cards/cards.controller.js';
import { CategoriesController } from './controllers/catalogs/categories.controller.js';
import { ItemsController } from './controllers/catalogs/items.controller.js';
import { VariationsController } from './controllers/catalogs/variations.controller.js';
import { CustomersController } from './controllers/customers/customers.controller.js';
import { LocationsController } from './controllers/locations/locations.controller.js';
import { MerchantsController } from './controllers/merchants/merchants.controller.js';
import { OrdersController } from './controllers/orders/orders.controller.js';
import { SquareWebhookController } from './controllers/square-webhook.controller.js';
import { StripeWebhookController } from './controllers/stripe.webhooks.controller.js';
import { AppConfigEntity } from './entities/app-config/app-config.entity.js';
import { CatalogImageEntity } from './entities/catalogs/catalog-image.entity.js';
import { CatalogEntity } from './entities/catalogs/catalog.entity.js';
import { CategoryEntity } from './entities/catalogs/category.entity.js';
import { ItemModifierListEntity } from './entities/catalogs/item-modifier-list.entity.js';
import { ItemEntity } from './entities/catalogs/item.entity.js';
import { ModifierListEntity } from './entities/catalogs/modifier-list.entity.js';
import { ModifierLocationOverrideEntity } from './entities/catalogs/modifier-location-override.entity.js';
import { ModifierEntity } from './entities/catalogs/modifier.entity.js';
import { VariationLocationOverride } from './entities/catalogs/variation-location-override.entity.js';
import { VariationEntity } from './entities/catalogs/variation.entity.js';
import { AppInstall } from './entities/customers/app-install.entity.js';
import { CustomerEntity } from './entities/customers/customer.entity.js';
import { AddressEntity } from './entities/locations/address.entity.js';
import { BusinessHoursPeriodEntity } from './entities/locations/business-hours-period.entity.js';
import { LocationEntity } from './entities/locations/location.entity.js';
import { MerchantEntity } from './entities/merchants/merchant.entity.js';
import { LineItemModifierEntity } from './entities/orders/line-item-modifier.entity.js';
import { LineItemEntity } from './entities/orders/line-item.entity.js';
import { OrderEntity } from './entities/orders/order.entity.js';
import { CustomerMerchantGuard } from './guards/customer-merchant.guard.js';
import { CustomersGuard } from './guards/customers.guard.js';
import { MerchantsGuard } from './guards/merchants.guard.js';
import { MyOrderAppSquareConfig } from './moa-square.config.js';
import { AppConfigService } from './services/app-config/app-config.service.js';
import { CatalogImagesService } from './services/catalogs/catalog-images.service.js';
import { CatalogSortService } from './services/catalogs/catalog-sort.service.js';
import { CatalogsService } from './services/catalogs/catalogs.service.js';
import { CategoriesService } from './services/catalogs/categories.service.js';
import { ItemModifierListService } from './services/catalogs/item-modifier-list.service.js';
import { ItemsService } from './services/catalogs/items.service.js';
import { ModifierListsService } from './services/catalogs/modifier-lists.service.js';
import { ModifierLocationOverridesService } from './services/catalogs/modifier-location-overrides.service.js';
import { ModifiersService } from './services/catalogs/modifiers.service.js';
import { VariationLocationOverridesService } from './services/catalogs/variation-location-overrides.service.js';
import { VariationsService } from './services/catalogs/variations.service.js';
import { AppInstallsService } from './services/customers/app-installs.service.js';
import { CustomersService } from './services/customers/customers.service.js';
import { AddressService } from './services/locations/address.service.js';
import { BusinessHoursPeriodsService } from './services/locations/business-hours-period.service.js';
import { LocationsService } from './services/locations/locations.service.js';
import { MerchantsFirebaseService } from './services/merchants/merchants.firebase.service.js';
import { MerchantsService } from './services/merchants/merchants.service.js';
import { MerchantsSquareService } from './services/merchants/merchants.square.service.js';
import { MerchantsStripeService } from './services/merchants/merchants.stripe.service.js';
import { LineItemModifierService } from './services/orders/line-item-modifier.service.js';
import { LineItemService } from './services/orders/line-item.service.js';
import { OrdersService } from './services/orders/orders.service.js';
import { OrdersUtils } from './services/orders/orders.utils.js';

@Module({
  imports: [
    ConfigModule.forFeature(MyOrderAppSquareConfig),
    AuthenticationModule,
    UsersModule,
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
      AppInstall,
      AppConfigEntity,
      MerchantEntity,
      OrderEntity,
      LineItemEntity,
      LineItemModifierEntity,
    ]),
    MailModule,
  ],
  exports: [MerchantsSquareService],
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
    MerchantsFirebaseService,
    MerchantsGuard,
    OrdersService,
    LineItemService,
    LineItemModifierService,
    OrdersUtils,
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
