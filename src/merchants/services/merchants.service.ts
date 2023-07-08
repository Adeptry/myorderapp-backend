import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { nanoid } from 'nanoid';
import { User } from 'src/users/entities/user.entity';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { SquareService } from '../../square/square.service';
import { StripeService } from '../../stripe/stripe.service';
import { MoaCreateMerchantInput } from '../dto/create-merchant.input';
import { MoaUpdateMerchantInput } from '../dto/update-merchant.input';
import { MoaCatalog } from '../entities/catalog.entity';
import { MoaMerchant } from '../entities/merchant.entity';

@Injectable()
export class MerchantsService {
  private readonly logger = new Logger(MerchantsService.name);

  constructor(
    @InjectRepository(MoaMerchant)
    private readonly merchantRepository: Repository<MoaMerchant>,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
    @Inject(forwardRef(() => SquareService))
    private readonly squareService: SquareService,
  ) {}

  async create(input: MoaCreateMerchantInput) {
    const entity = this.merchantRepository.create(input);

    if (!input.moaId) {
      entity.moaId = nanoid();
    }

    // const stripeCustomer = await this.stripeService.createCustomer({
    //   email: entity.email,
    //   phone: entity.phoneNumber,
    //   name: entity.fullName,
    // });
    // entity.stripeId = stripeCustomer?.id;

    return await this.merchantRepository.save(entity);
  }

  findAll(options?: FindManyOptions<MoaMerchant>) {
    return this.merchantRepository.find(options);
  }

  findOne(
    options: FindOneOptions<MoaMerchant>,
  ): Promise<MoaMerchant | null | undefined> {
    return this.merchantRepository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<MoaMerchant>): Promise<MoaMerchant> {
    return this.merchantRepository.findOneOrFail(options);
  }

  async update(moaId: string, updateMerchantInput: MoaUpdateMerchantInput) {
    const entity = await this.findOneOrFail({ where: { moaId } });

    if (updateMerchantInput.moaId !== undefined) {
      await this.merchantRepository.delete(moaId);
    }

    Object.assign(entity, updateMerchantInput);

    if (updateMerchantInput.moaId !== undefined) {
      await this.merchantRepository.delete(moaId);
    }

    return await this.save(entity);
  }

  async save(merchant: MoaMerchant) {
    return this.merchantRepository.save(merchant);
  }

  async delete(moaId: string): Promise<boolean> {
    const deleteResult = await this.merchantRepository.delete({ moaId });
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
    return this.merchantRepository
      .createQueryBuilder()
      .relation(MoaMerchant, 'catalog')
      .of(entity)
      .loadOne();
  }

  async loadOneUser(entity: MoaMerchant): Promise<User | null | undefined> {
    return this.merchantRepository
      .createQueryBuilder()
      .relation(MoaMerchant, 'user')
      .of(entity)
      .loadOne();
  }
}
