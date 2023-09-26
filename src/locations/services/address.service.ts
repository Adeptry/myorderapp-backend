import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../../locations/entities/address.entity.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';

@Injectable()
export class AddressService extends EntityRepositoryService<Address> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(Address)
    protected readonly repository: Repository<Address>,
  ) {
    const logger = new Logger(AddressService.name);
    super(repository, logger);
    this.logger = logger;
  }
}
