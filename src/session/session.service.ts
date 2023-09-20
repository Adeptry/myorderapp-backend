import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { AppLogger } from '../logger/app.logger.js';
import { User } from '../users/entities/user.entity.js';
import { RestfulEntityRepositoryService } from '../utils/restful-entity-repository-service.js';
import { Session } from './entities/session.entity.js';

@Injectable()
export class SessionService extends RestfulEntityRepositoryService<Session> {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(SessionService.name);
    super(sessionRepository, logger);
  }

  async deleteExcluding({
    excludeId,
    ...criteria
  }: {
    id?: Session['id'];
    user?: Pick<User, 'id'>;
    excludeId?: Session['id'];
  }): Promise<void> {
    await this.sessionRepository.delete({
      ...criteria,
      id: criteria.id ? criteria.id : excludeId ? Not(excludeId) : undefined,
    });
  }
}
