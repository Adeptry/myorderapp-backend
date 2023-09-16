import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../utils/entity-repository-service.js';
import { AppConfig } from './entities/app-config.entity.js';

@Injectable()
export class AppConfigService extends EntityRepositoryService<AppConfig> {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(
    @InjectRepository(AppConfig)
    protected readonly repository: Repository<AppConfig>,
  ) {
    super(repository);
  }
}
