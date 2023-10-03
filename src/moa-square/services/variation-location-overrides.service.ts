import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';
import { VariationLocationOverride } from '../entities/catalogs/variation-location-override.entity.js';

@Injectable()
export class VariationLocationOverridesService extends EntityRepositoryService<VariationLocationOverride> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(VariationLocationOverride)
    protected readonly repository: Repository<VariationLocationOverride>,
  ) {
    const logger = new Logger(VariationLocationOverridesService.name);
    super(repository, logger);
    this.logger = logger;
  }
}
