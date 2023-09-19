import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../logger/app.logger.js';
import { EntityRepositoryService } from '../utils/entity-repository-service.js';
import { AppConfig } from './entities/app-config.entity.js';

@Injectable()
export class AppConfigService extends EntityRepositoryService<AppConfig> {
  constructor(
    @InjectRepository(AppConfig)
    protected readonly repository: Repository<AppConfig>,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(AppConfigService.name);
    super(repository, logger);
  }
}
