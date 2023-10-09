import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestfulEntityRepositoryService } from '../database/restful-entity-repository-service.js';
import { CustomerEntity } from '../moa-square/entities/customer.entity.js';
import { MerchantEntity } from '../moa-square/entities/merchant.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { RoleEnum } from './roles.enum.js';

@Injectable()
export class UsersService extends RestfulEntityRepositoryService<UserEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(UserEntity)
    protected readonly repository: Repository<UserEntity>,
  ) {
    const logger = new Logger(UsersService.name);
    super(repository, logger);
    this.logger = logger;
  }

  findAdmins(): Promise<UserEntity[]> {
    return this.find({ where: { role: { id: RoleEnum.admin } } });
  }

  async removeIfUnrelated(entity: UserEntity) {
    this.logger.verbose(this.removeIfUnrelated.name, entity.id);
    const customers = await this.loadManyRelation<CustomerEntity>(
      entity,
      'customers',
    );
    const merchants = await this.loadManyRelation<MerchantEntity>(
      entity,
      'merchants',
    );

    if (customers.length === 0 && merchants.length === 0) {
      return this.remove(entity);
    } else {
      this.logger.verbose("Can't remove user", entity.id);
      return undefined;
    }
  }
}
