import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { AppConfig } from './entities/app-config.entity';

@Injectable()
export class AppConfigService extends BaseService<AppConfig> {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(
    @InjectRepository(AppConfig)
    protected readonly repository: Repository<AppConfig>,
  ) {
    super(repository);
  }
}
