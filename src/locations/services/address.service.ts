import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { Address } from '../entities/address.entity';

@Injectable()
export class AddressService extends BaseService<Address> {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    @InjectRepository(Address)
    protected readonly repository: Repository<Address>,
  ) {
    super(repository);
  }
}
