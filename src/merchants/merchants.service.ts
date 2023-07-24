import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { credential } from 'firebase-admin';
import { CatalogsService } from 'src/catalogs/catalogs.service';
import { Catalog } from 'src/catalogs/entities/catalog.entity';
import { AllConfigType } from 'src/config.type';
import { FirebaseAdminService } from 'src/firebase-admin/firebase-admin.service';
import { LocationsService } from 'src/locations/locations.service';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { SquareCatalogVersionUpdatedEventPayload } from 'src/square/payloads/square-catalog-version-updated-payload.entity';
import { SquareLocationCreatedEventPayload } from 'src/square/payloads/square-location-created-event-payload.entity';
import { SquareLocationUpdatedEventPayload } from 'src/square/payloads/square-location-updated-event-payload.entity';
import { SquareService } from 'src/square/square.service';
import { StripeService } from 'src/stripe/stripe.service';
import { User } from 'src/users/entities/user.entity';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { MerchantUpdateInput } from './dto/update-merchant.input';

@Injectable()
export class MerchantsService extends BaseService<Merchant> {
  private readonly logger = new Logger(MerchantsService.name);

  constructor(
    @InjectRepository(Merchant)
    protected readonly repository: Repository<Merchant>,
    @Inject(ConfigService)
    private readonly configService: ConfigService<AllConfigType>,
    @Inject(StripeService)
    private readonly stripeService: StripeService,
    @Inject(SquareService)
    private readonly squareService: SquareService,
    @Inject(FirebaseAdminService)
    private readonly firebaseAdminService: FirebaseAdminService,
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
    merchant: Merchant;
  }) {
    const { merchant, oauthAccessCode } = params;

    const accessTokenResult = (
      await this.squareService.obtainToken({
        oauthAccessCode,
      })
    ).result;

    if (!accessTokenResult) {
      throw new InternalServerErrorException(
        'Failed to obtain token from Square service',
      );
    }

    const { accessToken, expiresAt, merchantId, refreshToken } =
      accessTokenResult;

    if (!expiresAt) {
      throw new InternalServerErrorException(
        'No expiry date provided in the access token',
      );
    }

    merchant.squareAccessToken = accessToken;
    merchant.squareExpiresAt = new Date(Date.parse(expiresAt));
    merchant.squareId = merchantId;
    merchant.squareRefreshToken = refreshToken;

    return this.save(merchant);
  }

  async squareRefreshOauth(id: string) {
    const merchant = await this.findOneOrFail({
      where: { id },
    });
    const oauthRefreshToken = merchant.squareRefreshToken ?? '';
    const result = (
      await this.squareService.refreshToken({
        oauthRefreshToken,
      })
    ).result;
    merchant.squareAccessToken = result.accessToken;
    merchant.squareExpiresAt = new Date(Date.parse(result.expiresAt ?? ''));
    merchant.squareId = result.merchantId;
    merchant.squareRefreshToken = result.refreshToken;
    return await this.save(merchant);
  }

  async squareCatalogSync(params: { merchant: Merchant }) {
    const merchant = params.merchant;

    if (merchant?.id == null) {
      throw new NotFoundException('Merchant id is null');
    }

    const squareAccessToken = merchant.squareAccessToken;
    if (squareAccessToken == null) {
      throw new UnauthorizedException('Square access token is null');
    }

    let catalog = await this.loadOneRelation<Catalog>(merchant, 'catalog');
    if (catalog == null) {
      catalog = this.catalogsService.createEmpty();
      merchant.catalog = catalog;
      await this.catalogsService.save(catalog);
      await this.save(merchant);
    }

    if (catalog.id == null) {
      throw new Error('Catalog id is null');
    }

    await this.catalogsService.squareSync({
      squareAccessToken,
      catalogId: catalog.id,
      merchantId: merchant.id,
    });

    return;
  }

  @OnEvent('square.location.created')
  async handleSquareLocationCreated(
    payload: SquareLocationCreatedEventPayload,
  ) {
    if (!payload.merchant_id) {
      this.logger.error(
        'Missing merchant_id in SquareLocationCreatedEventPayload',
      );
      return;
    }

    const merchant = await this.findOne({
      where: { squareId: payload.merchant_id },
    });

    if (!merchant) {
      this.logger.error(`Merchant with id ${payload.merchant_id} not found`);
      return;
    }

    await this.squareLocationsSync({ merchant });
  }

  @OnEvent('square.location.updated')
  async handleSquareLocationUpdated(
    payload: SquareLocationUpdatedEventPayload,
  ) {
    if (!payload.merchant_id) {
      this.logger.error(
        'Missing merchant_id in SquareLocationCreatedEventPayload',
      );
      return;
    }

    const merchant = await this.findOne({
      where: { squareId: payload.merchant_id },
    });

    if (!merchant) {
      this.logger.error(`Merchant with id ${payload.merchant_id} not found`);
      return;
    }

    await this.squareLocationsSync({ merchant });
  }

  @OnEvent('square.catalog.version.updated')
  async handleSquareCatalogVersionUpdated(
    payload: SquareCatalogVersionUpdatedEventPayload,
  ) {
    if (!payload.merchant_id) {
      this.logger.error(
        'Missing merchant_id in SquareLocationCreatedEventPayload',
      );
      return;
    }

    const merchant = await this.findOne({
      where: { squareId: payload.merchant_id },
    });

    if (!merchant) {
      this.logger.error(`Merchant with id ${payload.merchant_id} not found`);
      return;
    }

    await this.squareCatalogSync({ merchant });
  }

  async squareLocationsSync(params: { merchant: Merchant }) {
    const entity = params.merchant;

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
    merchant: Merchant;
    successUrl: string;
    cancelUrl?: string;
  }): Promise<string | null> {
    const merchant = params.merchant;

    if (merchant.stripeCheckoutSessionId) {
      throw new BadRequestException(
        `Merchant with userId ${merchant.id} already has completed checkeout`,
      );
    }

    const user = await this.loadOneRelation<User>(merchant, 'user');
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
      mode: 'subscription',
      line_items: [
        {
          price: this.configService.getOrThrow('stripe.subscriptionPrice', {
            infer: true,
          }),
          quantity: 1,
        },
        {
          price: this.configService.getOrThrow('stripe.developerPrice', {
            infer: true,
          }),
          quantity: 1,
          adjustable_quantity: {
            enabled: true,
            minimum: 0,
            maximum: 1,
          },
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
    merchant: Merchant;
    checkoutSessionId: string;
  }): Promise<Merchant | null> {
    const entity = params.merchant;

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

  firebaseAdminApp(params: { merchant: Merchant }) {
    const entity = params.merchant;

    try {
      const app = this.firebaseAdminService.getApp(entity.id);
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
        entity.id,
      );
      return app;
    } catch (error) {
      this.logger.log(error);
      return null;
    }
  }
}
