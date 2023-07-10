import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { credential } from 'firebase-admin';
import { nanoid } from 'nanoid';
import { CatalogsService } from 'src/catalogs/catalogs.service';
import { Catalog } from 'src/catalogs/entities/catalog.entity';
import { Category } from 'src/catalogs/entities/category.entity';
import { CategoriesService } from 'src/catalogs/services/categories.service';
import { FirebaseAdminService } from 'src/firebase-admin/firebase-admin.service';
import { LocationsService } from 'src/locations/locations.service';
import { MoaMerchant } from 'src/merchants/entities/merchant.entity';
import { SquareService } from 'src/square/square.service';
import { StripeService } from 'src/stripe/stripe.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';
import { PaginationOptions } from 'src/utils/types/pagination-options';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { MoaCreateMerchantInput } from './dto/create-merchant.input';
import { MoaUpdateMerchantInput } from './dto/update-merchant.input';

@Injectable()
export class MerchantsService {
  private readonly logger = new Logger(MerchantsService.name);

  constructor(
    @InjectRepository(MoaMerchant)
    private readonly repository: Repository<MoaMerchant>,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
    @Inject(forwardRef(() => SquareService))
    private readonly squareService: SquareService,
    @Inject(forwardRef(() => CatalogsService))
    private readonly catalogsService: CatalogsService,
    @Inject(forwardRef(() => CategoriesService))
    private readonly categoriesService: CategoriesService,
    @Inject(forwardRef(() => LocationsService))
    private readonly locationsService: LocationsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => FirebaseAdminService))
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  async create(input: MoaCreateMerchantInput) {
    const entity = this.repository.create(input);

    if (!entity.id) {
      entity.id = nanoid();
    }

    const user = await this.usersService.findOneOrFail({ id: input.userId });

    const stripeCustomer = await this.stripeService.createCustomer({
      email: user.email ?? '',
      phone: user.phoneNumber ?? '',
      name: user.firstName ?? '',
    });
    entity.stripeId = stripeCustomer?.id;

    return await this.repository.save(entity);
  }

  async squareConfirmOauth(params: {
    oauthAccessCode: string;
    userId: string;
  }) {
    const merchant = await this.findOne({
      where: { userId: params.userId },
    });

    if (!merchant) {
      throw new NotFoundException(
        `Merchant with userId ${params.userId} not found`,
      );
    }

    const accessTokenResponse = await this.squareService.obtainToken(
      params.oauthAccessCode,
    );

    if (!accessTokenResponse) {
      throw new Error('Failed to obtain token from Square service');
    }

    merchant.squareAccessToken = accessTokenResponse.accessToken;
    merchant.squareExpiresAt = new Date(
      Date.parse(accessTokenResponse.expiresAt ?? ''),
    );
    merchant.squareId = accessTokenResponse.merchantId;
    merchant.squareRefreshToken = accessTokenResponse.refreshToken;

    return await this.save(merchant);
  }

  async squareRefreshOauth(id: string) {
    const merchant = await this.findOneOrFail({
      where: { id },
    });
    const oauthRefreshToken = merchant.squareRefreshToken ?? '';
    const accessToken = await this.squareService.refreshToken(
      oauthRefreshToken,
    );
    merchant.squareAccessToken = accessToken.accessToken;
    merchant.squareExpiresAt = new Date(
      Date.parse(accessToken.expiresAt ?? ''),
    );
    merchant.squareId = accessToken.merchantId;
    merchant.squareRefreshToken = accessToken.refreshToken;
    return await this.save(merchant);
  }

  async squareSync(params: { userId: string }) {
    const entity = await this.findOneOrFail({
      where: { userId: params.userId },
    });

    if (entity.id == null) {
      throw new NotFoundException('Merchant id is null');
    }

    const squareAccessToken = entity.squareAccessToken;

    if (squareAccessToken == null) {
      throw new UnauthorizedException('Square access token is null');
    }

    let catalog = await this.loadOneCatalogForEntity({ entity });
    if (catalog == null) {
      catalog = this.catalogsService.create();
      entity.catalog = catalog;
      await this.catalogsService.save(catalog);
      await this.save(entity);
    }

    if (catalog.id == null) {
      throw new Error('Catalog id is null');
    }

    entity.catalog = await this.catalogsService.squareSync({
      squareAccessToken,
      catalogId: catalog.id,
    });

    await this.locationsService.sync({
      merchantId: entity.id,
      squareAccessToken,
    });

    return entity;
  }

  async stripeCreateCheckoutSessionId(params: {
    userId: string;
  }): Promise<string | null> {
    const merchant = await this.findOne({
      where: { userId: params.userId },
    });

    if (!merchant) {
      throw new NotFoundException(
        `Merchant with userId ${params.userId} not found`,
      );
    }

    const session = await this.stripeService.createCheckoutSession({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
        {
          price: process.env.STRIPE_ONE_TIME_PRICE_ID,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      customer: merchant.stripeId,
      client_reference_id: merchant.id,
      success_url: `${process.env.REACT_APP_CLIENT_URI}/merchant/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.REACT_APP_CLIENT_URI}/merchant/`,
    });

    if (!session) {
      throw new Error('Failed to retrieve session from Stripe service');
    }

    return session.id;
  }

  async stripeConfirmCheckoutSessionId(params: {
    userId: string;
    checkoutSessionId: string;
  }): Promise<MoaMerchant | null> {
    const entity = await this.findOne({
      where: { userId: params.userId },
    });

    if (!entity) {
      throw new NotFoundException(
        `Merchant with userId ${params.userId} not found`,
      );
    }

    const session = await this.stripeService.retrieveCheckoutSession(
      params.checkoutSessionId,
    );

    if (entity == null) {
      return null;
    }

    entity.stripeCheckoutSessionId = session.id;
    return this.save(entity);
  }

  async firebaseAdminApp(id: string) {
    const entity = await this.findOneOrFail({ where: { id } });

    try {
      const app = this.firebaseAdminService.getApp(id);
      return app;
    } catch {
      // do nothing, the app doesn't exist
    }
    try {
      const appOptions = JSON.parse(JSON.stringify(entity.firebaseAppOptions));
      const app = this.firebaseAdminService.initializeApp(
        {
          credential: credential.cert(appOptions),
          databaseURL: entity.firebaseDatabaseUrl,
        },
        id,
      );
      return app;
    } catch (error) {
      this.logger.log(error);
      return null;
    }
  }

  findAll(options?: FindManyOptions<MoaMerchant>) {
    return this.repository.find(options);
  }

  async findOne(
    options: FindOneOptions<MoaMerchant>,
  ): Promise<MoaMerchant | null | undefined> {
    const foundOne = await this.repository.findOne(options);
    console.log(
      this.squareService.oauthUrl({
        scope: [
          'MERCHANT_PROFILE_READ',
          'CUSTOMERS_WRITE',
          'CUSTOMERS_READ',
          'ORDERS_WRITE',
          'ORDERS_READ',
          'PAYMENTS_READ',
          'PAYMENTS_WRITE',
          'PAYMENTS_WRITE_ADDITIONAL_RECIPIENTS',
          'ITEMS_WRITE',
          'ITEMS_READ',
        ],
        state: foundOne?.id,
      }),
    );
    return foundOne;
  }

  findOneOrFail(options: FindOneOptions<MoaMerchant>): Promise<MoaMerchant> {
    return this.repository.findOneOrFail(options);
  }

  async update(id: string, updateMerchantInput: MoaUpdateMerchantInput) {
    const entity = await this.findOneOrFail({ where: { id } });

    Object.assign(entity, updateMerchantInput);

    return await this.save(entity);
  }

  async save(merchant: MoaMerchant) {
    return this.repository.save(merchant);
  }

  async delete(id: string): Promise<boolean> {
    const deleteResult = await this.repository.delete({ id });
    return deleteResult.affected !== undefined;
  }

  async getOneOrderedCatalogOrFailForUser(params: {
    user: User;
    onlyShowEnabled: boolean;
  }): Promise<Catalog | null | undefined> {
    const entity = await this.findOneOrFail({
      where: { userId: params.user.id },
    });
    return this.catalogsService.getOneOrderedOrFail({
      catalogId: entity.catalogId,
      onlyShowEnabled: params.onlyShowEnabled,
    });
  }

  async getManyCategoriesForUser(params: {
    user: User;
    onlyShowEnabled: boolean;
    pagination: PaginationOptions;
  }): Promise<InfinityPaginationResultType<Category>> {
    const entity = await this.findOneOrFail({
      where: { userId: params.user.id },
    });

    if (entity.catalogId == null) {
      throw new Error('Catalog id is null');
    }

    return this.categoriesService.getManyCategories({
      catalogId: entity.catalogId,
      onlyShowEnabled: params.onlyShowEnabled,
      pagination: params.pagination,
    });
  }

  async loadOneCatalogForUser(params: {
    user: User;
  }): Promise<Catalog | null | undefined> {
    const entity = await this.findOneOrFail({
      where: { userId: params.user.id },
    });
    return this.loadOneCatalogForEntity({ entity });
  }

  async loadOneCatalogForEntity(params: {
    entity: MoaMerchant;
  }): Promise<Catalog | null | undefined> {
    return this.repository
      .createQueryBuilder()
      .relation(MoaMerchant, 'catalog')
      .of(params.entity)
      .loadOne();
  }

  async loadOneUser(entity: MoaMerchant): Promise<User | null | undefined> {
    return this.repository
      .createQueryBuilder()
      .relation(MoaMerchant, 'user')
      .of(entity)
      .loadOne();
  }

  async loadLocations(entity: MoaMerchant): Promise<Location[]> {
    return this.repository
      .createQueryBuilder()
      .relation(MoaMerchant, 'locations')
      .of(entity)
      .loadMany();
  }
}
