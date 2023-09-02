import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from 'src/locations/entities/address.entity';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { Repository } from 'typeorm';

@Injectable()
export class AddressService extends EntityRepositoryService<Address> {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    @InjectRepository(Address)
    protected readonly repository: Repository<Address>,
  ) {
    super(repository);
  }
}
