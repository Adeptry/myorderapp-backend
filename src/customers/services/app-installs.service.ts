import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { AppInstall } from '../entities/app-install.entity';

@Injectable()
export class AppInstallsService extends BaseService<AppInstall> {
  constructor(
    @InjectRepository(AppInstall)
    protected readonly repository: Repository<AppInstall>,
  ) {
    super(repository);
  }
}
