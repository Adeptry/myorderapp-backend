import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityRepositoryService } from '../../../utils/entity-repository-service.js';
import { BusinessHoursPeriodEntity } from '../../entities/locations/business-hours-period.entity.js';

@Injectable()
export class BusinessHoursPeriodsService extends EntityRepositoryService<BusinessHoursPeriodEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(BusinessHoursPeriodEntity)
    protected readonly repository: Repository<BusinessHoursPeriodEntity>,
  ) {
    const logger = new Logger(BusinessHoursPeriodsService.name);
    super(repository, logger);
    this.logger = logger;
  }
}
