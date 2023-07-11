import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { credential } from 'firebase-admin';
import { CatalogsService } from 'src/catalogs/catalogs.service';
import { Catalog } from 'src/catalogs/entities/catalog.entity';
import { FirebaseAdminService } from 'src/firebase-admin/firebase-admin.service';
import { LocationsService } from 'src/locations/locations.service';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { SquareService } from 'src/square/square.service';
import { StripeService } from 'src/stripe/stripe.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { MerchantUpdateInput } from './dto/update-merchant.input';

@Injectable()
export class MerchantsService extends BaseService<Merchant> {
  private readonly logger = new Logger(MerchantsService.name);

  constructor(
    @InjectRepository(Merchant)
    protected readonly repository: Repository<Merchant>,
    @Inject(StripeService)
    private readonly stripeService: StripeService,
    @Inject(SquareService)
    private readonly squareService: SquareService,
    @Inject(FirebaseAdminService)
    private readonly firebaseAdminService: FirebaseAdminService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => CatalogsService))
    private readonly catalogsService: CatalogsService,
    @Inject(forwardRef(() => LocationsService))
    private readonly locationsService: LocationsService,
  ) {
    super(repository);
  }

  async assignAndSave(id: string, updateInput: MerchantUpdateInput) {
    const entity = await this.findOneOrFail({ where: { id } });
    Object.assign(entity, updateInput);
    return await this.save(entity);
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

  async squareCatalogSync(params: { userId: string }) {
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

    let catalog = await this.loadOneCatalog(entity);
    if (catalog == null) {
      catalog = this.catalogsService.createEmpty();
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

    return entity;
  }

  async squareLocationsSync(params: { userId: string }) {
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

    await this.locationsService.sync({
      merchantId: entity.id,
      squareAccessToken,
    });
  }

  async stripeCreateCheckoutSessionId(params: {
    userId: string;
    successUrl: string;
    cancelUrl?: string;
  }): Promise<string | null> {
    const merchant = await this.findOne({
      where: { userId: params.userId },
    });

    if (!merchant) {
      throw new NotFoundException(
        `Merchant with userId ${params.userId} not found`,
      );
    }

    if (merchant.stripeCheckoutSessionId) {
      throw new BadRequestException(
        `Merchant with userId ${params.userId} already has completed checkeout`,
      );
    }

    const user = await this.loadOneUser(merchant);
    if (!user) {
      throw new NotFoundException(`User with id ${merchant.userId} not found`);
    }

    if (!merchant.stripeId) {
      const stripeCustomer = await this.stripeService.createCustomer({
        email: user.email ?? '',
        phone: user.phoneNumber ?? '',
        name: user.firstName ?? '',
      });
      merchant.stripeId = stripeCustomer?.id;
      await this.save(merchant);
    }

    const session = await this.stripeService.createCheckoutSession({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: 'price_1J2igaIO3O3Eil4Y7Q7BhLUE',
          quantity: 1,
        },
        {
          price: 'price_1IdKuBIO3O3Eil4YJCztT5VY',
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      customer: merchant.stripeId,
      client_reference_id: merchant.id,
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
    });

    if (!session) {
      throw new Error('Failed to retrieve session from Stripe service');
    }

    return session.id;
  }

  async stripeConfirmCheckoutSessionId(params: {
    userId: string;
    checkoutSessionId: string;
  }): Promise<Merchant | null> {
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

    if (session.status != 'complete') {
      throw new UnauthorizedException(
        'Stripe checkout session is not complete',
      );
    }

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

  async loadOneUser(entity: Merchant): Promise<User | null | undefined> {
    return this.repository
      .createQueryBuilder()
      .relation(Merchant, 'user')
      .of(entity)
      .loadOne();
  }

  async loadOneCatalog(entity: Merchant): Promise<Catalog | null | undefined> {
    return this.repository
      .createQueryBuilder()
      .relation(Merchant, 'catalog')
      .of(entity)
      .loadOne();
  }

  async loadManyLocations(entity: Merchant): Promise<Location[]> {
    return this.repository
      .createQueryBuilder()
      .relation(Merchant, 'locations')
      .of(entity)
      .loadMany();
  }
}
