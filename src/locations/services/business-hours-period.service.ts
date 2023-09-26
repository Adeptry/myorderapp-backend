import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessHoursPeriod } from '../../locations/entities/business-hours-period.entity.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';

@Injectable()
export class BusinessHoursPeriodsService extends EntityRepositoryService<BusinessHoursPeriod> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(BusinessHoursPeriod)
    protected readonly repository: Repository<BusinessHoursPeriod>,
  ) {
    const logger = new Logger(BusinessHoursPeriodsService.name);
    super(repository, logger);
    this.logger = logger;
  }
}
