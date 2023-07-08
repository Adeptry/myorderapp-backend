import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MerchantsService } from 'src/merchants/services/merchants.service';
import { RoleEnum } from 'src/roles/roles.enum';
import { EntityCondition } from 'src/utils/types/entity-condition.type';
import { IPaginationOptions } from 'src/utils/types/pagination-options';
import { DeepPartial, Repository } from 'typeorm';
import { NullableType } from '../utils/types/nullable.type';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => MerchantsService))
    private merchantsService: MerchantsService,
  ) {}

  async create(createProfileDto: CreateUserDto): Promise<User> {
    const user = await this.usersRepository.save(
      this.usersRepository.create(createProfileDto),
    );

    if ((createProfileDto.role?.id as RoleEnum) === RoleEnum.merchant) {
      await this.merchantsService.create({ userId: user.id });
    }

    return user;
  }

  findManyWithPagination(
    paginationOptions: IPaginationOptions,
  ): Promise<User[]> {
    return this.usersRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });
  }

  findOne(fields: EntityCondition<User>): Promise<NullableType<User>> {
    return this.usersRepository.findOne({
      where: fields,
    });
  }

  update(id: string, payload: DeepPartial<User>): Promise<User> {
    return this.usersRepository.save(
      this.usersRepository.create({
        id,
        ...payload,
      }),
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.usersRepository.softDelete(id);
  }
}
