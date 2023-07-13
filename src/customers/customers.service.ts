import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { SquareService } from 'src/square/square.service';
import { User } from 'src/users/entities/user.entity';
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
  ) {
    super(repository);
  }

  async createAndSave(params: { user: User; merchant: Merchant }) {
    if (
      await this.findOne({
        where: { userId: params.user.id, merchantId: params.merchant.id },
      })
    ) {
      throw new BadRequestException('Customer already exists');
    }

    if (!params.merchant?.squareAccessToken) {
      throw new InternalServerErrorException(
        `Merchant does not have Square access token`,
      );
    }

    const entity = await this.save(
      this.create({
        merchantId: params.merchant.id,
        userId: params.user.id,
      }),
    );

    const result = await this.squareService.createCustomer({
      accessToken: params.merchant.squareAccessToken,
      request: {
        emailAddress: params.user.email ?? undefined,
        givenName: params.user.firstName ?? undefined,
        familyName: params.user.lastName ?? undefined,
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
