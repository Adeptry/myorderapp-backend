import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestfulEntityRepositoryService } from '../utils/restful-entity-repository-service.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService extends RestfulEntityRepositoryService<User> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(User)
    protected readonly repository: Repository<User>,
  ) {
    const logger = new Logger(UsersService.name);
    super(repository, logger);
    this.logger = logger;
  }
}
