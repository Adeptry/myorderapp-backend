/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../users/entities/user.entity.js';
import { RoleEnum } from '../../../users/roles.enum.js';
import { StatusEnum } from '../../../users/statuses.enum.js';

@Injectable()
export class UserSeedService {
  private readonly logger = new Logger(UserSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {
    this.logger.verbose(this.constructor.name);
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
