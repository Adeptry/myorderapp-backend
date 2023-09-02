import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppInstall } from 'src/customers/entities/app-install.entity';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { Repository } from 'typeorm';

@Injectable()
export class AppInstallsService extends EntityRepositoryService<AppInstall> {
  constructor(
    @InjectRepository(AppInstall)
    protected readonly repository: Repository<AppInstall>,
  ) {
    super(repository);
  }
}
