import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { AppInstallEntity } from '../entities/app-install.entity.js';

@Injectable()
export class AppInstallsService extends EntityRepositoryService<AppInstallEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(AppInstallEntity)
    protected readonly repository: Repository<AppInstallEntity>,
  ) {
    const logger = new Logger(AppInstallsService.name);
    super(repository, logger);
    this.logger = logger;
  }
}
