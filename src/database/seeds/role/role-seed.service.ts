import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../../../users/entities/role.entity.js';
import { RoleEnum } from '../../../users/roles.enum.js';

@Injectable()
export class RoleSeedService {
  private readonly logger = new Logger(RoleSeedService.name);

  constructor(
    @InjectRepository(RoleEntity)
    private repository: Repository<RoleEntity>,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  async run() {
    this.logger.verbose(this.run.name);
    const countUser = await this.repository.count({
      where: {
        id: RoleEnum.user,
      },
    });

    if (!countUser) {
      await this.repository.save(
        this.repository.create({
          id: RoleEnum.user,
        }),
      );
    }

    const countAdmin = await this.repository.count({
      where: {
        id: RoleEnum.admin,
      },
    });

    if (!countAdmin) {
      await this.repository.save(
        this.repository.create({
          id: RoleEnum.admin,
        }),
      );
    }
  }
}
