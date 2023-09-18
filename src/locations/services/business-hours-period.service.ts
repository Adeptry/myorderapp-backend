import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessHoursPeriod } from '../../locations/entities/business-hours-period.entity.js';
import { EntityRepositoryService } from '../../utils/entity-repository-service.js';

@Injectable()
export class BusinessHoursPeriodsService extends EntityRepositoryService<BusinessHoursPeriod> {
  constructor(
    @InjectRepository(BusinessHoursPeriod)
    protected readonly repository: Repository<BusinessHoursPeriod>,
  ) {
    super(repository);
  }
}
