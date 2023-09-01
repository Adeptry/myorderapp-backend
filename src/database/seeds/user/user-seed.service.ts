/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEnum } from 'src/roles/roles.enum';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async run() {
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
