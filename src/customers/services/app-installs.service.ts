import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppInstall } from 'src/customers/entities/app-install.entity';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';

@Injectable()
export class AppInstallsService extends BaseService<AppInstall> {
  constructor(
    @InjectRepository(AppInstall)
    protected readonly repository: Repository<AppInstall>,
  ) {
    super(repository);
  }
}
