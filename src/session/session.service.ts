import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { RestfulEntityRepositoryService } from '../database/restful-entity-repository-service.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { SessionEntity } from './entities/session.entity.js';

@Injectable()
export class SessionService extends RestfulEntityRepositoryService<SessionEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(SessionEntity)
    protected readonly repository: Repository<SessionEntity>,
  ) {
    const logger = new Logger(SessionService.name);
    super(repository, logger);
    this.logger = logger;
  }

  async deleteExcluding({
    excludeId,
    ...criteria
  }: {
    id?: SessionEntity['id'];
    user?: Pick<UserEntity, 'id'>;
    excludeId?: SessionEntity['id'];
  }): Promise<void> {
    await this.repository.delete({
      ...criteria,
      id: criteria.id ? criteria.id : excludeId ? Not(excludeId) : undefined,
    });
  }
}
