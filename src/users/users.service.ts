import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../logger/app.logger.js';
import { RestfulEntityRepositoryService } from '../utils/restful-entity-repository-service.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService extends RestfulEntityRepositoryService<User> {
  constructor(
    @InjectRepository(User)
    protected readonly repository: Repository<User>,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(UsersService.name);
    super(repository, logger);
  }
}
