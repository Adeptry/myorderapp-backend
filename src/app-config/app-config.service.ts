import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { AppConfig } from './entities/app-config.entity';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(
    @InjectRepository(AppConfig)
    private readonly repository: Repository<AppConfig>,
  ) {}

  create() {
    return 'This action adds a new appConfig';
  }

  findAll(options?: FindManyOptions<AppConfig>) {
    return this.repository.find(options);
  }

  findOne(
    options: FindOneOptions<AppConfig>,
  ): Promise<AppConfig | null | undefined> {
    return this.repository.findOne(options);
  }

  findOneOrFail(options: FindOneOptions<AppConfig>): Promise<AppConfig> {
    return this.repository.findOneOrFail(options);
  }

  update(id: string) {
    return `This action updates a #${id} appConfig`;
  }
}
