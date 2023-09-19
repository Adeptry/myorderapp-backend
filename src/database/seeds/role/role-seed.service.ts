import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../../../logger/app.logger.js';
import { Role } from '../../../roles/entities/role.entity.js';
import { RoleEnum } from '../../../roles/roles.enum.js';

@Injectable()
export class RoleSeedService {
  constructor(
    @InjectRepository(Role)
    private repository: Repository<Role>,
    private logger: AppLogger,
  ) {
    this.logger.setContext(RoleSeedService.name);
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
