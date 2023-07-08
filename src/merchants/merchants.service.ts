import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { nanoid } from 'nanoid';
import { CatalogsService } from 'src/catalogs/catalogs.service';
import { MoaCatalog } from 'src/catalogs/entities/catalog.entity';
import { LocationsService } from 'src/locations/locations.service';
import { MoaMerchant } from 'src/merchants/entities/merchant.entity';
import { SquareService } from 'src/square/square.service';
import { StripeService } from 'src/stripe/stripe.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { MoaCreateMerchantInput } from './dto/create-merchant.input';
import { MoaUpdateMerchantInput } from './dto/update-merchant.input';

@Injectable()
export class MerchantsService {
  private readonly logger = new Logger(MerchantsService.name);

  constructor(
    @InjectRepository(MoaMerchant)
    private readonly merchantsRepository: Repository<MoaMerchant>,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
    @Inject(forwardRef(() => SquareService))
    private readonly squareService: SquareService,
    @Inject(forwardRef(() => CatalogsService))
    private readonly catalogsService: CatalogsService,
    @Inject(forwardRef(() => LocationsService))
    private readonly locationsService: LocationsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async create(input: MoaCreateMerchantInput) {
    const entity = this.merchantsRepository.create(input);

    if (!input.moaId) {
      entity.moaId = nanoid();
    }

    const user = await this.usersService.findOneOrFail({ id: input.userId });

    const stripeCustomer = await this.stripeService.createCustomer({
      email: user.email ?? '',
      phone: user.phoneNumber ?? '',
      name: user.firstName ?? '',
    });
    entity.stripeId = stripeCustomer?.id;
    entity.squareAccessToken =
      'EAAAEOWFQd6GaSQsraEd9mnRaZ487STemt5ZbL5gTQLW8Y52ra64TC5nABsSvYVY';

    const merchant = await this.merchantsRepository.save(entity);

    merchant.moaId && (await this.squareSync(merchant.moaId));

    return merchant;
  }

  async squareSync(merchantMoaId: string) {
    const merchant = await this.findOneOrFail({
      where: { moaId: merchantMoaId },
    });

    const squareAccessToken = merchant.squareAccessToken;

    if (squareAccessToken == null) {
      throw new Error('Square access token is null');
    }

    let catalog = await this.loadOneCatalog(merchant);
    if (catalog == null) {
      catalog = this.catalogsService.create();
      merchant.catalog = catalog;
      await this.catalogsService.save(catalog);
      await this.save(merchant);
    }

    if (catalog.moaId == null) {
      throw new Error('Catalog moaId is null');
    }

    merchant.catalog = await this.catalogsService.squareSync({
      squareAccessToken,
      catalogMoaId: catalog.moaId,
    });

    await this.locationsService.sync({
      merchantMoaId,
      squareAccessToken,
    });

    return merchant;
  }

  findAll(options?: FindManyOptions<MoaMerchant>) {
    return this.merchantsRepository.find(options);
  }

  findOne(
    options: FindOneOptions<MoaMerchant>,
  ): Promise<MoaMerchant | null | undefined> {
    return this.merchantsRepository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<MoaMerchant>): Promise<MoaMerchant> {
    return this.merchantsRepository.findOneOrFail(options);
  }

  async update(moaId: string, updateMerchantInput: MoaUpdateMerchantInput) {
    const entity = await this.findOneOrFail({ where: { moaId } });

    if (updateMerchantInput.moaId !== undefined) {
      await this.merchantsRepository.delete(moaId);
    }

    Object.assign(entity, updateMerchantInput);

    if (updateMerchantInput.moaId !== undefined) {
      await this.merchantsRepository.delete(moaId);
    }

    return await this.save(entity);
  }

  async save(merchant: MoaMerchant) {
    return this.merchantsRepository.save(merchant);
  }

  async delete(moaId: string): Promise<boolean> {
    const deleteResult = await this.merchantsRepository.delete({ moaId });
    return deleteResult.affected !== undefined;
  }

  async squareConfirmOauth(moaId: string, oauthAccessCode: string) {
    const entity = await this.findOneOrFail({
      where: { moaId },
    });
    const accessTokenResponse = await this.squareService.obtainToken(
      oauthAccessCode,
    );

    entity.squareAccessToken = accessTokenResponse.accessToken;
    entity.squareExpiresAt = new Date(
      Date.parse(accessTokenResponse.expiresAt ?? ''),
    );
    entity.merchantSquareId = accessTokenResponse.merchantId;
    entity.squareRefreshToken = accessTokenResponse.refreshToken;

    await this.save(entity);

    // this.locationsService.sync({ merchantMoaId: entity.moaId! });
    // this.catalogsService.update({ merchantMoaId: entity.moaId! });

    return entity;
  }

  async squareRefreshOauth(moaId: string) {
    const merchant = await this.findOneOrFail({
      where: { moaId },
    });
    const oauthRefreshToken = merchant.squareRefreshToken ?? '';
    const accessToken = await this.squareService.refreshToken(
      oauthRefreshToken,
    );
    merchant.squareAccessToken = accessToken.accessToken;
    merchant.squareExpiresAt = new Date(
      Date.parse(accessToken.expiresAt ?? ''),
    );
    merchant.merchantSquareId = accessToken.merchantId;
    merchant.squareRefreshToken = accessToken.refreshToken;
    return await this.save(merchant);
  }

  async loadOneCatalog(
    entity: MoaMerchant,
  ): Promise<MoaCatalog | null | undefined> {
    return this.merchantsRepository
      .createQueryBuilder()
      .relation(MoaMerchant, 'catalog')
      .of(entity)
      .loadOne();
  }

  async loadOneUser(entity: MoaMerchant): Promise<User | null | undefined> {
    return this.merchantsRepository
      .createQueryBuilder()
      .relation(MoaMerchant, 'user')
      .of(entity)
      .loadOne();
  }

  async loadLocations(entity: MoaMerchant): Promise<Location[]> {
    return this.merchantsRepository
      .createQueryBuilder()
      .relation(MoaMerchant, 'locations')
      .of(entity)
      .loadMany();
  }
}
