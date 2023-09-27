import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../../utils/entity-repository-service.js';
import { AppConfigEntity } from '../../entities/app-config/app-config.entity.js';

@Injectable()
export class AppConfigService extends EntityRepositoryService<AppConfigEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(AppConfigEntity)
    protected readonly repository: Repository<AppConfigEntity>,
  ) {
    const logger = new Logger(AppConfigService.name);
    super(repository, logger);
    this.logger = logger;
  }
}
