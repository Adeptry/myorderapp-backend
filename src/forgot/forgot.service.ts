import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../database/entity-repository-service.js';
import { Forgot } from './entities/forgot.entity.js';

@Injectable()
export class ForgotService extends EntityRepositoryService<Forgot> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(Forgot)
    protected readonly repository: Repository<Forgot>,
  ) {
    const logger = new Logger(ForgotService.name);
    super(repository, logger);
    this.logger = logger;
  }
}
