import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppInstall } from '../../customers/entities/app-install.entity.js';
import { AppLogger } from '../../logger/app.logger.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';

@Injectable()
export class AppInstallsService extends EntityRepositoryService<AppInstall> {
  constructor(
    @InjectRepository(AppInstall)
    protected readonly repository: Repository<AppInstall>,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(AppInstallsService.name);
    super(repository, logger);
  }
}
