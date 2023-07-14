import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
}
