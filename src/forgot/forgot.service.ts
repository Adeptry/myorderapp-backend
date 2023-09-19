import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../logger/app.logger.js';
import { EntityRepositoryService } from '../utils/entity-repository-service.js';
import { Forgot } from './entities/forgot.entity.js';

@Injectable()
export class ForgotService extends EntityRepositoryService<Forgot> {
  constructor(
    @InjectRepository(Forgot)
    protected readonly repository: Repository<Forgot>,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(ForgotService.name);
    super(repository, logger);
  }
}
