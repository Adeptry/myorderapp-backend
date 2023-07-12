import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { MerchantsService } from 'src/merchants/merchants.service';
import { SquareService } from 'src/square/square.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService extends BaseService<Customer> {
  constructor(
    @InjectRepository(Customer)
    protected readonly repository: Repository<Customer>,
    @Inject(SquareService)
    private readonly squareService: SquareService,
    @Inject(MerchantsService)
    private readonly merchantsService: MerchantsService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {
    super(repository);
  }

  async createAndSave(params: { userId: string; merchantId: string }) {
    if (await this.findOne({ where: { userId: params.userId } })) {
      throw new BadRequestException('Customer already exists');
    }

    const user = await this.usersService.findOne({ id: params.userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const merchant = await this.merchantsService.findOne({
      where: { id: params.merchantId },
    });
    if (!merchant?.squareAccessToken) {
      throw new InternalServerErrorException(
        `Merchant does not have Square access token`,
      );
    }

    const entity = await this.save(
      this.create({
        merchantId: merchant.id,
        userId: user.id,
      }),
    );

    const client = this.squareService.client({
      accessToken: merchant.squareAccessToken,
    });
    const result = await this.squareService.createCustomer({
      client,
      request: {
        emailAddress: user.email ?? undefined,
        givenName: user.firstName ?? undefined,
        familyName: user.lastName ?? undefined,
        idempotencyKey: entity.id,
      },
    });
    if (!result?.id) {
      throw new InternalServerErrorException(
        `Failed to create Square customer`,
      );
    }

    entity.squareId = result.id;
    return await this.save(entity);
  }

  async loadOneMerchant(
    entity: Customer,
  ): Promise<Merchant | null | undefined> {
    return this.repository
      .createQueryBuilder()
      .relation(Customer, 'merchant')
      .of(entity)
      .loadOne();
  }

  async loadOneUser(entity: Customer): Promise<User | null | undefined> {
    return this.repository
      .createQueryBuilder()
      .relation(Customer, 'user')
      .of(entity)
      .loadOne();
  }
}
