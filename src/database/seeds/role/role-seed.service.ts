import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/roles/entities/role.entity';
import { RoleNameEnum } from 'src/roles/roles.enum';
import { Repository } from 'typeorm';

@Injectable()
export class RoleSeedService {
  constructor(
    @InjectRepository(Role)
    private repository: Repository<Role>,
  ) {}

  async run() {
    const countUser = await this.repository.count({
      where: {
        id: RoleNameEnum.user,
      },
    });

    if (!countUser) {
      await this.repository.save(
        this.repository.create({
          id: RoleNameEnum.user,
        }),
      );
    }

    const countAdmin = await this.repository.count({
      where: {
        id: RoleNameEnum.admin,
      },
    });

    if (!countAdmin) {
      await this.repository.save(
        this.repository.create({
          id: RoleNameEnum.admin,
        }),
      );
    }
  }
}
