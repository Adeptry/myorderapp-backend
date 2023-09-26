import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppInstall } from '../../customers/entities/app-install.entity.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';

@Injectable()
export class AppInstallsService extends EntityRepositoryService<AppInstall> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(AppInstall)
    protected readonly repository: Repository<AppInstall>,
  ) {
    const logger = new Logger(AppInstallsService.name);
    super(repository, logger);
    this.logger = logger;
  }
}
