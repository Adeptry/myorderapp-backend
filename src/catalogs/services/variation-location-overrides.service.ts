import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariationLocationOverride } from '../../catalogs/entities/variation-location-override.entity.js';
import { AppLogger } from '../../logger/app.logger.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';

@Injectable()
export class VariationLocationOverridesService extends EntityRepositoryService<VariationLocationOverride> {
  constructor(
    @InjectRepository(VariationLocationOverride)
    protected readonly repository: Repository<VariationLocationOverride>,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(VariationLocationOverridesService.name);
    super(repository, logger);
  }
}
