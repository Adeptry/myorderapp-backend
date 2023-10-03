import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestfulEntityRepositoryService } from '../database/restful-entity-repository-service.js';
import { UserEntity } from './entities/user.entity.js';
import { RoleEnum } from './roles.enum.js';

@Injectable()
export class UsersService extends RestfulEntityRepositoryService<UserEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(UserEntity)
    protected readonly repository: Repository<UserEntity>,
  ) {
    const logger = new Logger(UsersService.name);
    super(repository, logger);
    this.logger = logger;
  }

  findAdmins(): Promise<UserEntity[]> {
    return this.find({ where: { role: { id: RoleEnum.admin } } });
  }
}
