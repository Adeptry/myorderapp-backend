import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../../locations/entities/address.entity.js';
import { AppLogger } from '../../logger/app.logger.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';

@Injectable()
export class AddressService extends EntityRepositoryService<Address> {
  constructor(
    @InjectRepository(Address)
    protected readonly repository: Repository<Address>,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(AddressService.name);
    super(repository, logger);
  }
}
