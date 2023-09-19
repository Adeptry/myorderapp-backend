import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../../../logger/app.logger.js';
import { Status } from '../../../statuses/entities/status.entity.js';
import { StatusEnum } from '../../../statuses/statuses.enum.js';

@Injectable()
export class StatusSeedService {
  constructor(
    @InjectRepository(Status)
    private repository: Repository<Status>,
    private logger: AppLogger,
  ) {
    this.logger.setContext(StatusSeedService.name);
  }

  async run() {
    this.logger.verbose(this.run.name);
    const count = await this.repository.count();

    if (!count) {
      await this.repository.save([
        this.repository.create({
          id: StatusEnum.active,
          name: 'Active',
        }),
        this.repository.create({
          id: StatusEnum.inactive,
          name: 'Inactive',
        }),
      ]);
    }
  }
}
