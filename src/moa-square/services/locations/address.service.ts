import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../../utils/entity-repository-service.js';
import { AddressEntity } from '../../entities/locations/address.entity.js';

@Injectable()
export class AddressService extends EntityRepositoryService<AddressEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(AddressEntity)
    protected readonly repository: Repository<AddressEntity>,
  ) {
    const logger = new Logger(AddressService.name);
    super(repository, logger);
    this.logger = logger;
  }
}
