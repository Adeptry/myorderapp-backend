/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../../../logger/app.logger.js';
import { RoleEnum } from '../../../roles/roles.enum.js';
import { StatusEnum } from '../../../statuses/statuses.enum.js';
import { User } from '../../../users/entities/user.entity.js';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private logger: AppLogger,
  ) {
    this.logger.setContext(UserSeedService.name);
  }

  async run() {
    this.logger.verbose(this.run.name);
    const countAdmin = await this.userRepository.count({
      where: {
        role: {
          id: RoleEnum.admin,
        },
      },
    });

    if (!countAdmin) {
      await this.userRepository.save(
        this.userRepository.create({
          firstName: process.env.ADMIN_FIRST_NAME!,
          lastName: process.env.ADMIN_LAST_NAME!,
          email: process.env.ADMIN_EMAIL!,
          password: process.env.ADMIN_PASSWORD!,
          role: {
            id: RoleEnum.admin,
          },
          status: {
            id: StatusEnum.active,
            name: 'Active',
          },
        }),
      );
    }
  }
}
