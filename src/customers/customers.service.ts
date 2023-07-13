import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { User } from 'src/users/entities/user.entity';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService extends BaseService<Customer> {
  constructor(
    @InjectRepository(Customer)
    protected readonly repository: Repository<Customer>,
  ) {
    super(repository);
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
