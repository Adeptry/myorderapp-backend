import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusEntity } from '../../../users/entities/status.entity.js';
import { StatusEnum } from '../../../users/statuses.enum.js';

@Injectable()
export class StatusSeedService {
  private readonly logger = new Logger(StatusSeedService.name);

  constructor(
    @InjectRepository(StatusEntity)
    private repository: Repository<StatusEntity>,
  ) {
    this.logger.verbose(this.constructor.name);
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
