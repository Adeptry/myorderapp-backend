import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { RestfulEntityRepositoryService } from '../database/restful-entity-repository-service.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { Session } from './entities/session.entity.js';

@Injectable()
export class SessionService extends RestfulEntityRepositoryService<Session> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(Session)
    protected readonly repository: Repository<Session>,
  ) {
    const logger = new Logger(SessionService.name);
    super(repository, logger);
    this.logger = logger;
  }

  async deleteExcluding({
    excludeId,
    ...criteria
  }: {
    id?: Session['id'];
    user?: Pick<UserEntity, 'id'>;
    excludeId?: Session['id'];
  }): Promise<void> {
    await this.repository.delete({
      ...criteria,
      id: criteria.id ? criteria.id : excludeId ? Not(excludeId) : undefined,
    });
  }
}
